import { jsPDF } from "jspdf";

export function generateSpecPDF() {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Color Palette
  const slate900 = [15, 23, 42];  // #0f172a (Primary Text / Dark background elements)
  const slate600 = [71, 85, 105]; // #475569 (Secondary Text)
  const gold500 = [217, 119, 6];  // #d97706 (Amber branding / Line accents)
  const bgLight = [248, 250, 252]; // #f8fafc (Callout box fill)

  // Helper function to draw dynamic page headers/footers
  const drawPageFrame = (pageNumber: number) => {
    // Top border accent
    doc.setFillColor(slate900[0], slate900[1], slate900[2]); // slate-900
    doc.rect(0, 0, 210, 4, "F");

    // Header Branding
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(slate600[0], slate600[1], slate600[2]);
    doc.text("L'HORIZON HOTELS & RESORTS", 15, 12);
    doc.setFont("helvetica", "normal");
    doc.text("GUEST PORTAL CMS SPECIFICATION", 150, 12);

    // Line Divider
    doc.setDrawColor(226, 232, 240); // border-slate-200
    doc.setLineWidth(0.3);
    doc.line(15, 15, 195, 15);

    // Footer
    doc.line(15, 282, 195, 282);
    doc.setFontSize(7);
    doc.text("CONFIDENTIAL - FOR INTERNAL STAFF & OPERATIONS USE ONLY", 15, 287);
    doc.text(`PAGE ${pageNumber} OF 2`, 180, 287);
  };

  // --- PAGE 1: SPECIFICATION & FIELD STRUCTURES ---
  drawPageFrame(1);

  // Main Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(slate900[0], slate900[1], slate900[2]);
  doc.text("DYNAMIC CMS BROCHURE INGESTION GUIDE", 15, 25);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(gold500[0], gold500[1], gold500[2]);
  doc.text("Configuring your brochures and menus for AI powered directory overlays", 15, 30);

  // Intro paragraph
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  const introTxt = "Our Google Gemini-powered Knowledge Processor analyzes any uploaded hotel pamphlet, guest guide, culinary menu, or flyer. It extracts the details and formats them automatically into interactive categories. To ensure the highest level of extraction accuracy, please structure your files using the guidelines below:";
  const splitIntro = doc.splitTextToSize(introTxt, 180);
  doc.text(splitIntro, 15, 36);

  let y = 52;

  // Render a section header
  const renderSectionHeader = (title: string, icon: string) => {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(15, y, 180, 7, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.text(`${icon}  ${title}`, 18, y + 5);

    doc.setDrawColor(gold500[0], gold500[1], gold500[2]);
    doc.setLineWidth(1);
    doc.line(15, y, 15, y + 7); // Gold left bar accent
    y += 11;
  };

  // Section 1: Promotions Carousel
  renderSectionHeader("SECTION 1: ROTATING PROMOTIONS (SLIDESHOW HERO)", "1.");
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(slate900[0], slate900[1], slate900[2]);
  
  const fieldsPromo = [
    { name: "Promo Title", desc: "The main caption/headline of the special banner (e.g., 'Saffron Whispers Couples Massage')." },
    { name: "Narrative", desc: "A compelling description appealing to guests. Mention highlights, packages, or specific features." },
    { name: "Action Label", desc: "The wording for the CTA button (e.g., 'Secure Package', 'Reserve Table', 'Browse Program')." },
    { name: "Destination URL", desc: "Where the button should redirect (can be relative in-app paths or direct external web pages)." }
  ];

  fieldsPromo.forEach(field => {
    doc.setFont("helvetica", "bold");
    doc.text(`• ${field.name}:`, 20, y);
    doc.setFont("helvetica", "normal");
    const docDesc = doc.splitTextToSize(field.desc, 145);
    doc.text(docDesc, 50, y);
    y += Math.max(5, docDesc.length * 4.2) + 1;
  });

  y += 4;

  // Section 2: Hotel Facilities Explorer
  renderSectionHeader("SECTION 2: PROPERTY FACILITIES & AMENITIES", "2.");
  
  const fieldsFac = [
    { name: "Facility Name", desc: "The name of the court, spa chamber, gym, pool or lounge (e.g., 'Vanguard Fitness Club')." },
    { name: "Description", desc: "Outline included amenities, physical features, location or reservation policies." },
    { name: "Classification", desc: "Must specify one of three master categories: 'Wellness', 'Fitness', or 'General'." }
  ];

  fieldsFac.forEach(field => {
    doc.setFont("helvetica", "bold");
    doc.text(`• ${field.name}:`, 20, y);
    doc.setFont("helvetica", "normal");
    const docDesc = doc.splitTextToSize(field.desc, 145);
    doc.text(docDesc, 50, y);
    y += Math.max(5, docDesc.length * 4.2) + 1;
  });

  y += 4;

  // Section 3: Dining Spot Hub & Operating Hours
  renderSectionHeader("SECTION 3: RESTAURANTS & BARS (CUISINE TIMINGS)", "3.");
  
  const fieldsRest = [
    { name: "Restaurant Name", desc: "The name of the dining room, bistro, lounge, or bar (e.g., 'The Obsidian Rooftop Bar')." },
    { name: "Sensory Concept", desc: "Culinary style description, vibe, dress code, typical menu highlights, and scenery description." },
    { name: "Services & Hours", desc: "Operational layers with hours. Specify morning, sunset, or all-day tiers (e.g. 07:00 - 11:30)." }
  ];

  fieldsRest.forEach(field => {
    doc.setFont("helvetica", "bold");
    doc.text(`• ${field.name}:`, 20, y);
    doc.setFont("helvetica", "normal");
    const docDesc = doc.splitTextToSize(field.desc, 145);
    doc.text(docDesc, 50, y);
    y += Math.max(5, docDesc.length * 4.2) + 1;
  });


  // --- PAGE 2: TEST BROCHURE TEMPLATE ---
  doc.addPage();
  drawPageFrame(2);

  y = 25;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(slate900[0], slate900[1], slate900[2]);
  doc.text("READY-TO-USE TEST BROCHURE TEMPLATE", 15, y);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.text("Below is a pre-formatted template. copy this verbatim to test your AI overlay feature:", 15, y + 5);

  y += 12;

  // Large grey bounding box for copying
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]); // light light gray
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.4);
  doc.rect(15, y, 180, 235);

  // Content for the box
  let boxY = y + 7;
  const printLine = (text: string, isBold = false, indent = 0, size = 8.5, isGold = false) => {
    doc.setFontSize(size);
    if (isBold) doc.setFont("helvetica", "bold");
    else doc.setFont("helvetica", "normal");

    if (isGold) doc.setTextColor(gold500[0], gold500[1], gold500[2]);
    else doc.setTextColor(slate900[0], slate900[1], slate900[2]);

    doc.text(text, 20 + indent, boxY);
    boxY += 4.5;
  };

  printLine("L'HORIZON GRAND ESTATE - OFFICIAL SEASONS PAMPHLET", true, 0, 10, true);
  boxY += 2;
  
  printLine("[PROMOTIONS]", true, 0, 9);
  printLine("PROMOTIONS 1: Ocean Mist Sunrise Champagne Breakfast", true, 4);
  printLine("Description: Sip on our house reserve French champagne as the dawn breaks over the Atlantic shoreline. Enjoy locally-sourced wild oysters, organic egg soufflés, and handcrafted artisan pastries.", false, 4);
  printLine("Button Label: Book Breakfast", false, 4);
  printLine("Link destination: /api/reservations/breakfast", false, 4);
  boxY += 1.5;

  printLine("PROMOTIONS 2: Saffron Glow Warm Stone Spa Sanctuary", true, 4);
  printLine("Description: Melt away travel fatigue with non-allergenic mineral volcanic stones coated in our signature Saffron infusion oil. Included is access to the aromatic steam lounges and herbal tea bars.", false, 4);
  printLine("Button Label: Reserve Treatment", false, 4);
  printLine("Link destination: /api/bookings/spa", false, 4);
  boxY += 3;

  printLine("[FACILITIES]", true, 0, 9);
  printLine("FACILITY 1: The Azure Wellness Hammam", true, 4);
  printLine("Details: A marble-lined therapeutic wellness hammam featuring dual temperature pools, skin scrubbing pillars, and high-vapor mint inhalation chambers designed to clear travel congestion.", false, 4);
  printLine("Section Type: Wellness", false, 4);
  boxY += 1.5;

  printLine("FACILITY 2: Peak Altitude Cardio Court", true, 4);
  printLine("Details: Complete high-intensity workout lounge equipped with interactive visual screens, custom heart monitoring gloves, and direct floor-to-ceiling panoramic ocean vistas.", false, 4);
  printLine("Section Type: Fitness", false, 4);
  boxY += 1.5;

  printLine("FACILITY 3: The Royal Sapphire Library", true, 4);
  printLine("Details: Quiet wood-panelled classic room housing private rare publications, complimentary local cognacs, and desktop terminals overlooking the inner fountain gardens.", false, 4);
  printLine("Section Type: General", false, 4);
  boxY += 3;

  printLine("[RESTAURANTS]", true, 0, 9);
  printLine("RESTAURANT 1: The Glasshouse Conservatoire", true, 4);
  printLine("Cuisine Vibe: Botanical glass dome serving Mediterranean wood-fired seafood. Candlelit evening atmosphere, light piano accompaniment, and a strictly smart-casual dress code policy.", false, 4);
  printLine("Bookings Active: Yes", false, 4);
  printLine("Book Wording: Reserve Glasshouse Table", false, 4);
  printLine("Operating Hour Tiers:", true, 4);
  printLine("- Breakfast Tier: 07:00 to 11:30", false, 8);
  printLine("- Sunset Dinner Tier: 18:00 to 22:30", false, 8);
  boxY += 1.5;

  printLine("RESTAURANT 2: Obsidian Spirits Lounge", true, 4);
  printLine("Cuisine Vibe: Dark basalt stone walls framing custom crystal decanters. Features expert mixology, private single-malt selections, fireside acoustic lounge bands, and panoramic views of the water.", false, 4);
  printLine("Bookings Active: No", false, 4);
  printLine("Operating Hour Tiers:", true, 4);
  printLine("- Afternoon Lounge Session: 15:30 to 19:00", false, 8);
  printLine("- Late Bar Tier: 21:00 to 01:30", false, 8);

  // Trigger Save
  doc.save("direct_hotel_directory_ingestion_specification.pdf");
}
