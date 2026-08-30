import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Image as ImageIcon, RotateCcw, PenTool, CheckCircle, Calculator } from 'lucide-react';

const TEMPLATES = [
  { id: 'round-table', name: 'Round Dining Table', basePrice: 15000 },
  { id: 'live-edge', name: 'Live-Edge Table', basePrice: 25000 },
  { id: 'minimalist-desk', name: 'Minimalist Desk', basePrice: 12000 },
  { id: 'custom-sofa', name: 'Custom Sofa', basePrice: 35000 },
  { id: 'bed-frame', name: 'Bed Frame', basePrice: 28000 },
];

const MATERIALS = [
  { id: 'pine', name: 'Pine Wood', multiplier: 1 },
  { id: 'oak', name: 'Oak Wood', multiplier: 1.5 },
  { id: 'walnut', name: 'Walnut Wood', multiplier: 2.2 },
  { id: 'metal', name: 'Industrial Metal', multiplier: 1.2 },
  { id: 'fabric', name: 'Premium Fabric', multiplier: 1.8 },
  { id: 'teak', name: 'Teak Wood', multiplier: 1.4, description: 'Premium golden-brown grain, highly durable & moisture-resistant' },
];

const SPECIAL_FEATURES = [
  "2 Drawers", "3 Drawers", "Open Bottom Shelf", 
  "Cable Management Grommet", "Glass Top", "Carved Legs"
];

import { jsPDF } from 'jspdf';

const CustomStudio = () => {
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [material, setMaterial] = useState(MATERIALS[0]);
  const [dimensions, setDimensions] = useState({ length: 120, width: 60, height: 75 });
  const [prompt, setPrompt] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const canvasRef = useRef(null);
  const quoteRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Price Engine
  useEffect(() => {
    // Basic formula: Base * Material + (Volume / 1000) * factor
    const volume = dimensions.length * dimensions.width * dimensions.height;
    const sizeFactor = volume / 10000; // arbitrary scale for INR
    const price = Math.round(template.basePrice * material.multiplier + sizeFactor * 10);
    setEstimatedPrice(price);
  }, [template, material, dimensions]);

  const getCoordinates = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // Canvas Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e, canvas);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    // e.preventDefault(); // Might interfere with passive listeners if not careful, skip for now.
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e, canvas);
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#4f46e5'; // indigo-600
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Construct prompt
    const featuresStr = selectedFeatures.length > 0 ? ` with exactly ${selectedFeatures.join(' and ')}` : '';
    const notesStr = prompt ? `. Additional notes: ${prompt}` : '';
    
    let materialStr = material.name;
    if (material.id === 'teak') {
      materialStr = "luxurious Teak Wood finish, rich golden-brown wood grain texture";
    }
    
    const fullPrompt = `A modern ${materialStr} ${template.name}${featuresStr}${notesStr}, photorealistic, 3D showroom render, studio lighting, highly detailed.`;
    const encodedPrompt = encodeURIComponent(fullPrompt);
    // Generate random seed to prevent caching issues if prompt is the same
    const seed = Math.floor(Math.random() * 100000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true&seed=${seed}`;
    
    // Pre-load image to simulate loading state and ensure it's ready before showing
    const img = new Image();
    img.onload = () => {
      setGeneratedImage(imageUrl);
      setIsGenerating(false);
    };
    img.onerror = () => {
      setIsGenerating(false);
      alert("Failed to generate image. Please try again.");
    }
    img.src = imageUrl;
  };

  const toggleFeature = (feature) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const handleSubmitInquiry = async () => {
    if (!customerName || !customerPhone) {
      alert("Please enter your Name and Phone Number to submit inquiry.");
      return;
    }
    if (!generatedImage) {
      alert("Please generate a design first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        template: template.name,
        material: material.name,
        dimensions: `${dimensions.length}x${dimensions.width}x${dimensions.height} cm`,
        special_features: selectedFeatures.join(', '),
        notes: prompt,
        image_url: generatedImage,
        estimated_price: estimatedPrice
      };
      
      await fetch('http://localhost:3001/api/custom-inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      alert('Inquiry submitted successfully! You can now download the quote or share via WhatsApp.');
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      alert('Failed to submit inquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePDF = async () => {
    if (!generatedImage) return;
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Header
    pdf.setFontSize(22);
    pdf.setTextColor(63, 81, 181); // Indigoish
    pdf.text('FURNITURE STUDIO SHOWROOM', 15, 20);
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Custom AI Design Quotation', 15, 28);
    
    // Customer Details (Right side)
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(customerName || 'Customer', 195, 20, { align: 'right' });
    pdf.setTextColor(100, 100, 100);
    pdf.text(customerPhone || '', 195, 26, { align: 'right' });
    pdf.setFontSize(10);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 195, 32, { align: 'right' });
    
    pdf.setDrawColor(200, 200, 200);
    pdf.line(15, 38, 195, 38);

    // Image fetching via proxy
    try {
      const response = await fetch(`http://localhost:3001/api/proxy-image?url=${encodeURIComponent(generatedImage)}`);
      if (!response.ok) throw new Error('Proxy fetch failed');
      const blob = await response.blob();
      const base64data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      pdf.addImage(base64data, 'JPEG', 15, 45, 90, 67.5);
    } catch (err) {
      console.warn('Failed to embed image in PDF via proxy, proceeding with text only:', err);
      pdf.setFontSize(10);
      pdf.text('[Image unavailable - Network/CORS Error]', 15, 50);
    }

    // Specifications
    let yPos = 45;
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Specifications', 115, yPos);
    
    yPos += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Item:', 115, yPos);
    pdf.setTextColor(0, 0, 0);
    pdf.text(template.name, 145, yPos);
    
    yPos += 8;
    pdf.setTextColor(100, 100, 100);
    pdf.text('Material:', 115, yPos);
    pdf.setTextColor(0, 0, 0);
    pdf.text(material.name, 145, yPos);
    
    yPos += 8;
    pdf.setTextColor(100, 100, 100);
    pdf.text('Dimensions:', 115, yPos);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${dimensions.length} x ${dimensions.width} x ${dimensions.height} cm`, 145, yPos);
    
    yPos += 8;
    pdf.setTextColor(100, 100, 100);
    pdf.text('Special Features:', 115, yPos);
    pdf.setTextColor(0, 0, 0);
    const splitFeatures = pdf.splitTextToSize(selectedFeatures.length > 0 ? selectedFeatures.join(', ') : 'None', 50);
    pdf.text(splitFeatures, 145, yPos);
    
    yPos += (splitFeatures.length * 5) + 3;
    if (prompt) {
      pdf.setTextColor(100, 100, 100);
      pdf.text('Notes:', 115, yPos);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'italic');
      const splitNotes = pdf.splitTextToSize(`"${prompt}"`, 50);
      pdf.text(splitNotes, 145, yPos);
      pdf.setFont(undefined, 'normal');
      yPos += (splitNotes.length * 5);
    }
    
    // Price
    yPos = Math.max(yPos + 10, 120);
    pdf.setFillColor(245, 245, 245);
    pdf.rect(15, yPos, 180, 20, 'F');
    pdf.setFontSize(14);
    pdf.setTextColor(50, 50, 50);
    pdf.text('Estimated Price:', 25, yPos + 13);
    pdf.setFontSize(18);
    pdf.setTextColor(63, 81, 181);
    pdf.text(`Rs. ${estimatedPrice.toLocaleString('en-IN')}`, 185, yPos + 14, { align: 'right' });
    
    // Terms
    yPos += 35;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(15, yPos, 195, yPos);
    yPos += 8;
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont(undefined, 'bold');
    pdf.text('Terms & Conditions:', 15, yPos);
    pdf.setFont(undefined, 'normal');
    pdf.text('1. This is a computer-generated estimated quotation based on AI design.', 15, yPos + 6);
    pdf.text('2. Final pricing and production timelines will be confirmed upon physical consultation.', 15, yPos + 12);
    pdf.text('3. Colors and textures in the generated image are indicative and may slightly vary.', 15, yPos + 18);
    
    pdf.save(`Quotation_${customerName || 'Custom_Furniture'}.pdf`);
  };

  const shareWhatsApp = () => {
    if (!generatedImage) return;
    const message = `*FURNITURE STUDIO SHOWROOM - QUOTATION* 🛋️
   
*Customer:* ${customerName || 'Valued Customer'}
*Phone:* ${customerPhone || 'N/A'}

*Item:* ${template.name || 'Custom Furniture'}
*Material:* ${material.name || 'Standard Wood'}
*Dimensions:* ${dimensions.length} x ${dimensions.width} x ${dimensions.height} cm
*Features:* ${selectedFeatures.join(', ') || 'Standard Build'}

*Estimated Price:* ₹${estimatedPrice?.toLocaleString('en-IN') || '0'}

*Design Link:* ${generatedImage || 'N/A'}

Thank you for choosing Furniture Studio Showroom!`;
    const encodedText = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Custom AI Furniture Studio
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Design your dream piece. Sketch your concept, select materials, and let our AI visualize it instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Controls */}
        <div className="xl:col-span-5 space-y-8">
          
          {/* Templates */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              1. Choose a Base Template
            </h3>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    template.id === t.id 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Materials */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">2. Select Material</h3>
            <div className="grid grid-cols-2 gap-3">
              {MATERIALS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMaterial(m)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-between ${
                    material.id === m.id 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                      : 'border-transparent bg-gray-50 text-gray-700 hover:border-gray-200'
                  }`}
                >
                  {m.name}
                  {material.id === m.id && <CheckCircle className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">3. Dimensions (cm)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 uppercase font-bold tracking-wider">Length</label>
                <input 
                  type="number" 
                  value={dimensions.length}
                  onChange={(e) => setDimensions({...dimensions, length: Number(e.target.value)})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 uppercase font-bold tracking-wider">Width</label>
                <input 
                  type="number" 
                  value={dimensions.width}
                  onChange={(e) => setDimensions({...dimensions, width: Number(e.target.value)})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 uppercase font-bold tracking-wider">Height</label>
                <input 
                  type="number" 
                  value={dimensions.height}
                  onChange={(e) => setDimensions({...dimensions, height: Number(e.target.value)})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Special Features */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">4. Special Features</h3>
            <div className="flex flex-wrap gap-2">
              {SPECIAL_FEATURES.map((feature) => (
                <button
                  key={feature}
                  onClick={() => toggleFeature(feature)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                    selectedFeatures.includes(feature)
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-indigo-300'
                  }`}
                >
                  {feature}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">5. Specific Details / Notes</h3>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., with carved legs, brass handles, mid-century modern style..."
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none h-32 resize-none transition-all"
            ></textarea>
          </div>

          {/* Price & Generate */}
          <div className="bg-gradient-to-br from-gray-900 to-indigo-950 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <Calculator className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <div className="mb-8">
                <p className="text-indigo-200 text-sm font-semibold tracking-wider uppercase mb-2">Estimated Price</p>
                <p className="text-5xl font-extrabold tracking-tight">₹{estimatedPrice.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-400 mt-2">*Final price may vary based on exact customisations.</p>
              </div>
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 bg-white text-indigo-950 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-950 border-t-transparent"></div>
                    Generating Design...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate AI Design
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Sketch & Result */}
        <div className="xl:col-span-7 space-y-8 flex flex-col">
          
          {/* Sketch Canvas */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-indigo-500" />
                Rough Sketch (Optional)
              </h3>
              <button 
                onClick={clearCanvas}
                className="text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                Clear
              </button>
            </div>
            <div className="flex-1 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 relative overflow-hidden group">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-10"
              ></canvas>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40 group-hover:opacity-20 transition-opacity">
                <p className="text-gray-400 font-medium select-none flex flex-col items-center gap-2">
                  <PenTool className="w-8 h-8" />
                  Draw your idea here...
                </p>
              </div>
            </div>
          </div>

          {/* AI Result */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-[450px]">
             <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-indigo-500" />
                AI Generated Visualization
              </h3>
              <div className="w-full aspect-video max-h-[420px] bg-gray-50 rounded-2xl overflow-hidden relative flex items-center justify-center border border-gray-100">
                {generatedImage ? (
                  <img 
                    src={generatedImage} 
                    alt="AI Generated Furniture" 
                    className="w-full h-full object-contain rounded-xl bg-neutral-900/5 transition-opacity duration-500"
                  />
                ) : (
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="w-10 h-10 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">Your generated design will appear here.</p>
                    <p className="text-gray-400 text-sm mt-1">Configure your options and click generate to start.</p>
                  </div>
                )}
                
                {isGenerating && (
                   <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-20">
                     <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center border border-gray-100">
                        <div className="relative mb-6">
                           <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
                           <div className="w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                           <Sparkles className="w-6 h-6 text-indigo-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="font-bold text-gray-900 text-lg">Dreaming up your design...</p>
                        <p className="text-gray-500 text-sm mt-1">This takes just a few seconds.</p>
                     </div>
                   </div>
                )}
              </div>

              {/* Removed PDF Quote Invisible Template as we now use pure jsPDF */}

              {/* Inquiry Submission & Sharing Actions */}
              {generatedImage && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <input type="text" placeholder="Your Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    <input type="tel" placeholder="Your Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={handleSubmitInquiry}
                      disabled={isSubmitting}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-75"
                    >
                      <CheckCircle className="w-5 h-5" /> {isSubmitting ? 'Submitting...' : 'Save Inquiry'}
                    </button>
                    <button 
                      onClick={generatePDF}
                      className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      Download PDF Quote
                    </button>
                    <button 
                      onClick={shareWhatsApp}
                      className="flex-1 bg-[#25D366] hover:bg-[#1ebe5d] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      WhatsApp Quote
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomStudio;
