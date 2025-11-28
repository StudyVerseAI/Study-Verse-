
import React, { useState } from 'react';
import { X, Check, Crown, Zap, Shield, Smartphone } from 'lucide-react';

interface PremiumModalProps {
  onClose: () => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState<'STARTER' | 'SCHOLAR' | 'ACHIEVER'>('SCHOLAR');

  const plans = {
    STARTER: {
      name: 'Starter',
      price: 99,
      generations: 500,
      features: ['500 AI Generations', 'Basic Support', 'Standard Speed'],
      color: 'bg-blue-50 border-blue-200 text-blue-900',
      btnColor: 'bg-blue-600 hover:bg-blue-700'
    },
    SCHOLAR: {
      name: 'Scholar',
      price: 299,
      generations: 2000,
      features: ['2000 AI Generations', 'Priority Support', 'Fast Generation', 'Export to PDF'],
      color: 'bg-primary-50 border-primary-200 text-primary-900',
      btnColor: 'bg-primary-600 hover:bg-primary-700'
    },
    ACHIEVER: {
      name: 'Achiever',
      price: 499,
      generations: 'Unlimited',
      features: ['Unlimited Generations', '24/7 Priority Support', 'Turbo Speed', 'All Future Features'],
      color: 'bg-purple-50 border-purple-200 text-purple-900',
      btnColor: 'bg-purple-600 hover:bg-purple-700'
    }
  };

  const currentPlan = plans[selectedPlan];
  
  // UPI Payment URL
  const upiUrl = `upi://pay?pa=shivabasavaraj@ybl&pn=Shivabasavaraj Jyoti&am=${currentPlan.price}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/50 hover:bg-white rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-slate-500" />
        </button>

        {/* Left Side: Plans */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-slate-50/50">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Upgrade to Premium</h2>
            <p className="text-slate-500">Choose the plan that fits your learning needs.</p>
          </div>

          <div className="grid gap-4">
            {(Object.keys(plans) as Array<keyof typeof plans>).map((key) => {
              const plan = plans[key];
              const isSelected = selectedPlan === key;
              
              return (
                <div 
                  key={key}
                  onClick={() => setSelectedPlan(key)}
                  className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                    isSelected 
                      ? `${plan.color} border-current shadow-lg scale-[1.02]` 
                      : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      {key === 'ACHIEVER' && <Crown className="w-5 h-5 fill-current" />}
                      {plan.name}
                    </h3>
                    {isSelected && <div className="bg-current rounded-full p-1"><Check className="w-4 h-4 text-white" /></div>}
                  </div>
                  
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold">₹{plan.price}</span>
                    <span className="text-sm opacity-80">/ lifetime</span>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="text-sm flex items-center gap-2">
                        <Check className="w-4 h-4" /> {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Payment/QR */}
        <div className="w-full md:w-[400px] bg-white border-l border-slate-100 p-8 flex flex-col items-center justify-center text-center relative">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-400 via-primary-500 to-purple-500"></div>
          
          <div className="mb-8">
             <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-600">
                <Smartphone className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-bold text-slate-800">Scan to Pay</h3>
             <p className="text-sm text-slate-400 mt-1">Use any UPI app (GPay, PhonePe, Paytm)</p>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 mb-6 relative group">
             <img 
               src={qrCodeUrl} 
               alt="UPI QR Code" 
               className="w-48 h-48 object-contain mix-blend-multiply"
             />
             <div className="absolute inset-0 flex items-center justify-center bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl backdrop-blur-sm">
                <p className="font-bold text-slate-800">₹{currentPlan.price}</p>
             </div>
          </div>

          <div className="w-full space-y-4">
             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-left">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Paying to</p>
                <p className="font-bold text-slate-800 text-sm">Shivabasavaraj Jyoti</p>
                <p className="font-mono text-xs text-slate-500 select-all">shivabasavaraj@ybl</p>
             </div>

             <button className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg transition-all active:scale-95 ${currentPlan.btnColor}`}>
               I've Completed Payment
             </button>
             
             <p className="text-xs text-slate-400 px-4">
               After payment, your credits will be added automatically within 5-10 minutes. Need help? Contact support.
             </p>
          </div>

          <div className="mt-8 flex gap-4 text-slate-300">
             <Shield className="w-6 h-6" />
             <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
