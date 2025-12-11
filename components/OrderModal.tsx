
import React, { useState, useEffect } from 'react';
import { Order, StoreSettings } from '../types';
import { X, CheckCircle, Printer, AlertCircle, Loader, Mail, Send, Smartphone, FileText, Utensils, Download, ChefHat, MessageCircle } from 'lucide-react';
import { sendReceiptEmail, sendReceiptSMS } from '../services/supabaseClient';
import { jsPDF } from "jspdf";

interface OrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  storeSettings?: StoreSettings;
}

export const OrderModal: React.FC<OrderModalProps> = ({ order, isOpen, onClose, title = "Order Details", storeSettings }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);
  
  // Email Receipt State
  const [email, setEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // SMS Receipt State
  const [phone, setPhone] = useState('');
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  // Play a sound when the drawer opens
  useEffect(() => {
    if (isOpen && order?.openDrawer && title === "Payment Successful!") {
      // Simple beep simulation or just console log for the mechanism
      console.log("🔊 MECHANISM: Cash Drawer Kick Signal Sent");
    }
  }, [isOpen, order, title]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setEmailSent(false);
      setPhone('');
      setSmsSent(false);
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    setIsPrinting(true);
    // Simulate printing delay
    setTimeout(() => {
      setIsPrinting(false);
      setPrintSuccess(true);
      // Reset success message after 3 seconds
      setTimeout(() => setPrintSuccess(false), 3000);
    }, 1500);
  };

  const getPriceModifier = (option?: string) => {
    if (!option) return 0;
    let total = 0;
    const regex = /\(\+R([\d.]+)\)/g;
    let match;
    while ((match = regex.exec(option)) !== null) {
      total += parseFloat(match[1]);
    }
    return total;
  };

  const getFormattedReceiptText = (forUrl: boolean = false) => {
    const storeName = storeSettings?.name || "Cosmo Dumplings";
    const date = order.date.split(',')[0];
    const itemsList = order.items.map(i => {
      const mod = getPriceModifier(i.selectedOption);
      const price = (i.product.price + mod) * i.quantity;
      return `${i.quantity}x ${i.product.name} (R${price.toFixed(0)})`;
    }).join(forUrl ? '%0a' : '\n');
    
    const newLine = forUrl ? '%0a' : '\n';
    
    return `Receipt from ${storeName}${newLine}Order: ${order.id}${newLine}Date: ${date}${newLine}${newLine}Items:${newLine}${itemsList}${newLine}${newLine}Total: R ${order.total.toFixed(2)}${newLine}Thank you!`;
  };

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, 200] // Receipt paper size approximation
    });

    const centerX = 40; // 80mm / 2
    let y = 10;

    // Header - Store Info
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(storeSettings?.name || "Cosmo Dumplings", centerX, y, { align: "center" });
    y += 5;
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(storeSettings?.address || "123 Flavor Street, Cape Town", centerX, y, { align: "center" });
    y += 4;
    doc.text(storeSettings?.contact || "Tel: 021 555 0199", centerX, y, { align: "center" });
    y += 4;
    doc.text(storeSettings?.email || "hello@cosmodumplings.co.za", centerX, y, { align: "center" });
    y += 6;

    doc.line(5, y, 75, y); // Separator
    y += 5;

    // Order Meta
    doc.setFontSize(9);
    doc.text(`Order: ${order.id}`, 5, y);
    y += 4;
    doc.text(`Date: ${order.date}`, 5, y);
    y += 4;
    doc.text(`Staff: ${order.orderBy}`, 5, y);
    y += 4;
    doc.text(`Type: ${order.type} ${order.tableNumber ? `(T${order.tableNumber})` : ''}`, 5, y);
    y += 5;

    doc.line(5, y, 75, y);
    y += 5;

    // Items Header
    doc.setFont("helvetica", "bold");
    doc.text("Qty", 5, y);
    doc.text("Item", 15, y);
    doc.text("Total", 75, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 4;

    // Items List
    order.items.forEach(item => {
      const modifier = getPriceModifier(item.selectedOption);
      const itemTotal = ((item.product.price + modifier) * item.quantity).toFixed(2);
      
      doc.setFontSize(9);
      doc.text(`${item.quantity}x`, 5, y);
      
      // Handle item name wrapping
      const nameLines = doc.splitTextToSize(item.product.name, 45); // Wrap within 45mm
      doc.text(nameLines, 15, y);
      
      // Print price aligned with first line of name
      doc.text(itemTotal, 75, y, { align: "right" });
      
      y += (nameLines.length * 4);
      
      // Options and Notes
      if (item.selectedOption) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        // Wrap options if too long
        const optionLines = doc.splitTextToSize(`+ ${item.selectedOption}`, 55);
        doc.text(optionLines, 15, y);
        doc.setTextColor(0);
        y += (optionLines.length * 3);
      }
      if (item.notes) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.setFont("helvetica", "italic");
        const noteLines = doc.splitTextToSize(`* ${item.notes}`, 55);
        doc.text(noteLines, 15, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0);
        y += (noteLines.length * 3);
      }
      y += 1; // Spacing between items
    });

    doc.line(5, y, 75, y);
    y += 5;

    // Totals
    const tax = order.total * (storeSettings?.taxRate || 0.15); // Assuming VAT inclusive for display usually, but calc based on settings
    // Actually, app logic is total includes tax. So Subtotal = Total / 1.15
    const taxRate = 1 + (storeSettings?.taxRate || 0.15);
    const subtotal = order.total / taxRate;
    const taxAmount = order.total - subtotal;

    doc.setFontSize(9);
    doc.text("Subtotal:", 40, y, { align: "right" });
    doc.text(subtotal.toFixed(2), 75, y, { align: "right" });
    y += 4;
    doc.text("VAT:", 40, y, { align: "right" });
    doc.text(taxAmount.toFixed(2), 75, y, { align: "right" });
    y += 5;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", 40, y, { align: "right" });
    doc.text(`R ${order.total.toFixed(2)}`, 75, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 6;

    if (order.tendered) {
      doc.setFontSize(9);
      doc.text("Tendered:", 40, y, { align: "right" });
      doc.text(order.tendered.toFixed(2), 75, y, { align: "right" });
      y += 4;
      doc.text("Change:", 40, y, { align: "right" });
      doc.text(order.change?.toFixed(2) || "0.00", 75, y, { align: "right" });
      y += 5;
    }

    // Footer
    doc.setFontSize(8);
    doc.text(order.paymentMethod.toUpperCase(), centerX, y, { align: "center" });
    y += 8;
    
    doc.setFont("helvetica", "italic");
    const footerLines = doc.splitTextToSize(storeSettings?.footerMessage || "Thank you!", 70);
    doc.text(footerLines, centerX, y, { align: "center" });

    doc.save(`Receipt-${order.id}.pdf`);
  };

  const generateKitchenSlip = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, 200]
    });

    const centerX = 40;
    let y = 10;

    // Header - Kitchen Slip
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("KITCHEN ORDER", centerX, y, { align: "center" });
    y += 8;

    // Order Meta
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Order: ${order.id}`, 5, y);
    y += 5;
    doc.text(`Time: ${order.date}`, 5, y); 
    y += 5;
    doc.text(`Type: ${order.type} ${order.tableNumber ? `(T${order.tableNumber})` : ''}`, 5, y);
    y += 5;
    if (order.orderBy) {
        doc.text(`Server: ${order.orderBy}`, 5, y);
        y += 5;
    }

    doc.line(5, y, 75, y);
    y += 5;

    // Items Header
    doc.setFont("helvetica", "bold");
    doc.text("Qty", 5, y);
    doc.text("Item", 15, y);
    doc.setFont("helvetica", "normal");
    y += 5;

    // Items List
    doc.setFontSize(11);
    order.items.forEach(item => {
      
      doc.setFont("helvetica", "bold");
      doc.text(`${item.quantity}x`, 5, y);
      
      // Handle item name wrapping
      const nameLines = doc.splitTextToSize(item.product.name, 55); 
      doc.text(nameLines, 15, y);
      
      y += (nameLines.length * 4.5);
      
      // Options and Notes - highlighted for kitchen
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      if (item.selectedOption) {
        const optionLines = doc.splitTextToSize(`+ ${item.selectedOption}`, 60);
        doc.text(optionLines, 15, y);
        y += (optionLines.length * 4);
      }
      if (item.notes) {
        doc.setFont("helvetica", "italic");
        const noteLines = doc.splitTextToSize(`NOTE: ${item.notes}`, 60);
        doc.text(noteLines, 15, y);
        doc.setFont("helvetica", "normal");
        y += (noteLines.length * 4);
      }
      doc.setFontSize(11); // Reset for next item
      y += 2; // Spacing between items
    });

    doc.line(5, y, 75, y);
    y += 5;
    
    doc.setFontSize(8);
    doc.text("Printed: " + new Date().toLocaleTimeString(), centerX, y, { align: "center" });

    doc.save(`Kitchen-Order-${order.id}.pdf`);
  };

  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) return;
    setIsSendingEmail(true);
    
    // Call the service which attempts live send or falls back to simulation
    const success = await sendReceiptEmail(email, order);
    
    setIsSendingEmail(false);
    if (success) {
      setEmailSent(true);
    } else {
      alert("Could not send email. Please check connection.");
    }
  };

  // Cloud/API Simulation Send
  const handleSendSMS = async () => {
    if (!phone) return;
    setIsSendingSMS(true);
    
    // Pass the formatted body for backend usage (or simulation logging)
    const body = getFormattedReceiptText(false);
    const success = await sendReceiptSMS(phone, order, body);
    
    setIsSendingSMS(false);
    if (success) {
      setSmsSent(true);
    } else {
      alert("Could not send SMS via Gateway. Please check connection.");
    }
  };

  // Native App Send (sms: protocol)
  const handleNativeSMS = () => {
    if (!phone) return;
    // Basic validation
    if (phone.length < 3) return;
    
    const body = getFormattedReceiptText(true);
    window.location.href = `sms:${phone}?body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-cosmo-surface w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            {title === "Payment Successful!" && <CheckCircle className="w-5 h-5 text-green-500" />}
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications Area */}
        <div className="flex flex-col">
           {/* Cash Drawer Notification */}
          {order.openDrawer && title === "Payment Successful!" && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-3 flex items-center gap-3 animate-pulse">
              <div className="bg-yellow-100 dark:bg-yellow-800 p-2 rounded-full">
                 <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-yellow-800 dark:text-yellow-400">Cash Drawer Opened</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-500">Collect cash and dispense change.</p>
              </div>
            </div>
          )}

          {/* Print Notification */}
          {printSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 p-3 flex items-center gap-3 animate-in slide-in-from-top-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
              <div>
                <p className="text-sm font-bold text-green-800 dark:text-green-400">Sent to Printer</p>
                <p className="text-xs text-green-600 dark:text-green-500">Receipt is printing at the main station.</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-cosmo-red rounded-lg flex items-center justify-center text-white font-bold text-xl mx-auto mb-2 shadow-lg shadow-cosmo-red/30">
              CD
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">{storeSettings?.name || "Cosmo Dumplings"}</h2>
            <p className="text-xs text-gray-500">{storeSettings?.address || "123 Flavor Street, Cape Town"}</p>
            <p className="text-xs text-gray-500">{storeSettings?.contact || "Tel: 021 555 0199"}</p>
          </div>

          {/* Unique Order ID Section - Prominent Display */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center mb-4 border border-dashed border-gray-300 dark:border-gray-600">
             <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Order Number</span>
             <span className="block text-2xl font-black text-gray-900 dark:text-white font-mono tracking-tight">{order.id}</span>
          </div>

          <div className="border-t border-b border-gray-200 dark:border-gray-700 py-3 mb-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date:</span>
              <span className="text-gray-900 dark:text-white">{order.date}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Staff:</span>
              <span className="text-gray-900 dark:text-white">{order.orderBy}</span>
            </div>
             <div className="flex justify-between text-sm">
              <span className="text-gray-500">Type:</span>
              <span className="font-bold text-gray-900 dark:text-white">{order.type} {order.tableNumber ? `- T${order.tableNumber}` : ''}</span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {order.items.map((item, index) => (
              <div key={index} className="text-sm border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between mb-1.5">
                   <div className="flex gap-2">
                     <span className="font-bold text-cosmo-red">{item.quantity}x</span>
                     <span className="font-medium text-gray-900 dark:text-white">{item.product.name}</span>
                   </div>
                   <span className="font-bold text-gray-900 dark:text-white">R {((item.product.price + getPriceModifier(item.selectedOption)) * item.quantity).toFixed(2)}</span>
                </div>
                
                <div className="flex flex-col gap-1 pl-6">
                  {item.selectedOption && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 py-0.5 px-2 rounded-md self-start">
                      <Utensils size={10} />
                      <span>{item.selectedOption}</span>
                    </div>
                  )}
                  {item.notes && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 italic">
                      <FileText size={10} />
                      <span>{item.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
             <div className="flex justify-between text-sm text-gray-500">
               <span>Subtotal</span>
               <span>R {(order.total / 1.15).toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-sm text-gray-500">
               <span>VAT (15%)</span>
               <span>R {(order.total - (order.total / 1.15)).toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
               <span>Total</span>
               <span>R {order.total.toFixed(2)}</span>
             </div>
             
             {/* Cash Details */}
             {order.paymentMethod === 'Cash' && order.tendered !== undefined && (
               <>
                 <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                   <span>Amount Tendered</span>
                   <span>R {order.tendered.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-lg font-bold text-green-600 dark:text-green-400">
                   <span>Change Due</span>
                   <span>R {order.change?.toFixed(2)}</span>
                 </div>
               </>
             )}

              <div className="flex justify-between text-xs text-gray-400 pt-1 uppercase">
               <span>Payment Method</span>
               <span>{order.paymentMethod}</span>
             </div>
          </div>

          {/* Digital Receipts Section */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <span>Digital Receipts</span>
              <span className="text-[10px] font-normal normal-case bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                Live Ready
              </span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {/* Download Customer Receipt */}
              <button 
                onClick={generatePDF}
                className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Customer Slip
              </button>
              
              {/* Print Kitchen Slip */}
              <button 
                onClick={generateKitchenSlip}
                className="flex items-center justify-center gap-2 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-800 dark:text-orange-300 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                <ChefHat className="w-4 h-4" />
                Kitchen Slip
              </button>
            </div>
            
            {/* Email Receipt */}
            {emailSent ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium justify-center py-2 bg-green-50 dark:bg-green-900/20 rounded-lg animate-in fade-in">
                <CheckCircle className="w-4 h-4" /> Email sent to {email}
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="email" 
                    placeholder="Customer Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cosmo-red transition-colors"
                  />
                </div>
                <button 
                  onClick={handleSendEmail}
                  disabled={!email || !email.includes('@') || isSendingEmail}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors min-w-[3rem]"
                >
                  {isSendingEmail ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* SMS Receipt */}
            {smsSent ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium justify-center py-2 bg-green-50 dark:bg-green-900/20 rounded-lg animate-in fade-in">
                <CheckCircle className="w-4 h-4" /> SMS sent to {phone}
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="tel" 
                    placeholder="Mobile Number" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cosmo-red transition-colors"
                  />
                </div>
                <button 
                  onClick={handleNativeSMS}
                  disabled={!phone}
                  className="bg-green-600/20 hover:bg-green-600/30 text-green-700 dark:text-green-400 px-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors min-w-[3rem]"
                  title="Open in Messages App"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleSendSMS}
                  disabled={!phone || phone.length < 10 || isSendingSMS}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors min-w-[3rem]"
                  title="Send via Cloud"
                >
                  {isSendingSMS ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button 
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white py-3 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {isPrinting ? <Loader className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            {isPrinting ? 'Printing...' : 'Print'}
          </button>
          <button onClick={onClose} className="flex-1 bg-cosmo-red text-white py-3 rounded-xl font-medium hover:bg-rose-700 transition-colors shadow-lg shadow-cosmo-red/20">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
