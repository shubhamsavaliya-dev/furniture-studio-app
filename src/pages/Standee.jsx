import { QRCodeCanvas } from 'qrcode.react';
import { Printer, Scan, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

const Standee = () => {
  const [studioUrl, setStudioUrl] = useState('');

  useEffect(() => {
    setStudioUrl(`${window.location.origin}/studio`);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 flex flex-col items-center justify-center print:bg-white print:py-0 print:min-h-0">
      
      {/* Controls (Hidden in Print) */}
      <div className="mb-6 flex gap-4 print:hidden">
        <button 
          onClick={handlePrint}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
        >
          <Printer className="w-5 h-5" />
          Print Standee
        </button>
      </div>

      {/* Standee Canvas - A5 proportions (148 x 210 mm) */}
      {/* 
        Using a fixed aspect ratio or fixed dimensions that fit on an A4 paper for printing.
        An A5 is roughly 1:1.41. 
      */}
      <div className="bg-white shadow-2xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none relative w-[90vw] max-w-[500px] h-auto aspect-[1/1.41] flex flex-col print:w-[148mm] print:h-[210mm] print:max-w-none print:mx-auto">
        
        {/* Background Accents (Minimalist Stone/Wood feel) */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-stone-100 to-white -z-10"></div>
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-stone-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-stone-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

        <div className="flex-1 flex flex-col items-center p-10 text-center relative z-10 h-full justify-between">
          
          {/* Header Section */}
          <div className="w-full">
            <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight mb-4">
              Design Your Custom Furniture in 3D
            </h1>
            <p className="text-stone-600 text-sm md:text-base font-medium max-w-[90%] mx-auto">
              Scan to open Custom AI Studio, customize materials & dimensions, and get instant price estimates.
            </p>
          </div>

          {/* QR Code Section */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-stone-100 my-8">
            <div className="border-4 border-stone-900 p-4 rounded-2xl bg-white">
              {studioUrl && (
                <QRCodeCanvas 
                  value={studioUrl} 
                  size={200}
                  bgColor={"#ffffff"}
                  fgColor={"#1c1917"} // stone-900
                  level={"H"}
                  includeMargin={false}
                />
              )}
            </div>
            <p className="text-stone-500 font-bold uppercase tracking-widest text-xs mt-4">
              Scan to Start
            </p>
          </div>

          {/* Step-by-Step Icons */}
          <div className="w-full grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-2 text-stone-700">
                <Scan className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-stone-900">1. Scan</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-2 text-stone-700">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-stone-900">2. Customize</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-2 text-stone-700">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-stone-900">3. Instant Render</p>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Print CSS override */}
      <style>{`
        @media print {
          @page {
            size: A5 portrait;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
            background: white !important;
          }
          /* Hide Navbar and standard page wrappers if they exist when printing */
          nav, header, footer {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Standee;
