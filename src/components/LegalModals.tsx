import React from "react";
import { X, ShieldAlert, FileText } from "lucide-react";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsOfUseModal({ isOpen, onClose }: LegalModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer" 
        onClick={onClose}
      />
      
      {/* Modal Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#cca472]/10 text-[#cca472]">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-white tracking-wide">Terms of Use</h3>
              <p className="text-[10px] text-slate-500 font-mono">Last updated: June 20, 2026</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Scroll Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed custom-scrollbar text-left font-sans">
          
          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">1. AGREEMENT TO TERMS</h4>
            <p className="pt-1">
              These Terms of Use constitute a legally binding agreement made between you, whether personally or on behalf of an entity (&quot;<strong>you</strong>&quot;), and BligGroup (Pty) Ltd., doing business as Recos.co.za (&quot;<strong>Company</strong>&quot;, &quot;<strong>we</strong>&quot;, &quot;<strong>us</strong>&quot;, or &quot;<strong>our</strong>&quot;), concerning your access to and use of the Recos platform, including any web app accessed via QR code, hotel-assigned link, or related services (collectively, the &quot;<strong>Services</strong>&quot;).
            </p>
            <p>
              By accessing or using the Services, you agree that you have read, understood, and agree to be bound by all of these Terms of Use. IF YOU DO NOT AGREE WITH ALL OF THESE TERMS OF USE, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.
            </p>
            <p>
              We reserve the right, in our sole discretion, to make changes or modifications to these Terms of Use at any time and for any reason. We will alert you about any changes by updating the &quot;Last updated&quot; date of these Terms of Use, and you waive any right to receive specific notice of each such change. It is your responsibility to periodically review these Terms of Use to stay informed of updates. You will be subject to, and will be deemed to have been made aware of and to have accepted, the changes in any revised Terms of Use by your continued use of the Services after the date such revised Terms of Use are posted.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">2. WHAT RECOS IS</h4>
            <p className="pt-1">
              Recos is a white-label digital concierge and guest experience platform made available to you by a participating hotel (&quot;<strong>Hotel Partner</strong>&quot;). The Services allow you to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs sm:text-sm">
              <li>Access a chat function to communicate with your Hotel Partner&apos;s front desk/concierge team, which may be assisted by artificial intelligence (&quot;<strong>AI Concierge</strong>&quot;);</li>
              <li>View information about your Hotel Partner&apos;s amenities and in-house offerings (e.g. spa, dining, events);</li>
              <li>Discover curated local recommendations (restaurants, attractions, events) near the property; and</li>
              <li>View advertising content from local businesses relevant to your stay.</li>
            </ul>
            <p className="pt-1">
              Recos is provided to you free of charge. <strong>Recos does not process payments, bookings, or reservations directly.</strong> Where the Services reference a third-party booking, reservation, or payment service (e.g. a restaurant booking link), any such transaction takes place entirely on that third party&apos;s platform and is governed by their own terms — not these Terms of Use.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">3. ACCESS TO THE SERVICES</h4>
            <p className="pt-1">
              You do not register an account with Recos directly. Your access to the Services is provisioned automatically by your Hotel Partner, typically linked to your room number or booking, for the duration of your stay. Your Hotel Partner — not you — is responsible for granting and revoking this access.
            </p>
            <p>You agree to:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs sm:text-sm">
              <li>Use the Services only for their intended purpose during your stay;</li>
              <li>Not attempt to access another guest&apos;s chat, requests, or information;</li>
              <li>Not misuse, interfere with, or attempt to gain unauthorised access to the Services or any systems connected to them.</li>
            </ul>
            <p className="pt-1">
              Your access to the Services will generally end automatically at the end of your stay, or may be revoked earlier by your Hotel Partner or by us at our discretion.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">4. THE AI CONCIERGE</h4>
            <p className="pt-1">
              Part of the chat function within the Services may be powered by artificial intelligence. By using the AI Concierge, you acknowledge and agree that:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs sm:text-sm">
              <li>Responses are generated automatically and, while designed to be helpful and accurate, <strong>may occasionally be incorrect, incomplete, or unsuitable for your specific situation</strong>;</li>
              <li>The AI Concierge is not a substitute for direct communication with hotel staff for urgent, safety-related, or time-sensitive matters — if you have an emergency or urgent need, please contact your Hotel Partner&apos;s front desk directly or local emergency services;</li>
              <li>We and your Hotel Partner are not liable for any decision you make in reliance on information provided by the AI Concierge;</li>
              <li>Messages you send to the AI Concierge may be processed by third-party AI service providers as described in our Privacy Policy.</li>
            </ul>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">5. LOCAL RECOMMENDATIONS AND ADVERTISING</h4>
            <p className="pt-1">
              The Services display recommendations and advertising content from local businesses that are not affiliated with us or your Hotel Partner. These are provided for your convenience and information only.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-xs sm:text-sm">
              <li>We do not guarantee the accuracy, availability, pricing, or quality of any third-party business, product, or service referenced or advertised through the Services.</li>
              <li>Inclusion of a business in the Services does not constitute an endorsement by us or your Hotel Partner.</li>
              <li>Any interaction, booking, purchase, or transaction you have with a third-party business is solely between you and that business. We are not a party to that transaction and bear no responsibility or liability for it.</li>
            </ul>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">6. PROHIBITED USES</h4>
            <p className="pt-1 font-semibold text-slate-200">
              You may not access or use the Services for any purpose other than that for which we make the Services available. As a user of the Services, you agree not to:
            </p>
            <ul className="list-decimal pl-5 space-y-1.5 text-slate-400 text-xs">
              <li>Use the Services in any way that violates any applicable local, national, or international law or regulation;</li>
              <li>Use the Services to send abusive, threatening, defamatory, or otherwise unlawful content through the chat function;</li>
              <li>Attempt to impersonate another guest, hotel staff member, or any other person or entity;</li>
              <li>Use any automated system, including &quot;robots,&quot; &quot;spiders,&quot; or &quot;offline readers,&quot; to access the Services in a manner that sends more request messages than a human could reasonably produce;</li>
              <li>Attempt to bypass any measures designed to prevent or restrict access to the Services;</li>
              <li>Use the Services to advertise or offer to sell goods or services of your own without our express written consent;</li>
              <li>Interfere with, disrupt, or create an undue burden on the Services or networks connected to the Services.</li>
            </ul>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">7. INTELLECTUAL PROPERTY RIGHTS</h4>
            <p className="pt-1">
              Unless otherwise indicated, the Services — including all source code, databases, functionality, software, designs, branding, and content (collectively, the &quot;<strong>Content</strong>&quot;) — are owned or licensed by us and are protected by copyright and trademark laws.
            </p>
            <p>
              The Content is provided to you for your personal, non-commercial use during your stay only. You may not copy, reproduce, distribute, republish, or exploit any portion of the Content for commercial purposes without our express prior written permission.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">8. THIRD-PARTY LINKS</h4>
            <p className="pt-1">
              The Services may contain links to third-party websites and applications, including local business websites, booking platforms, and social media. We are not responsible for, and do not endorse, the content, accuracy, or practices of any third-party site. You access any such links at your own risk.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">9. DISCLAIMER</h4>
            <p className="pt-1 uppercase font-semibold text-slate-300">
              THE SERVICES ARE PROVIDED ON AN &quot;AS-IS&quot; AND &quot;AS-AVAILABLE&quot; BASIS. YOU AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SERVICES AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE SERVICES&apos; CONTENT OR THE CONTENT OF ANY WEBSITES OR SERVICES LINKED TO THE SERVICES, INCLUDING ANY AI-GENERATED RESPONSES OR THIRD-PARTY RECOMMENDATIONS.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">10. LIMITATION OF LIABILITY</h4>
            <p className="pt-1 uppercase text-slate-300">
              TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p>
              NOTHING IN THESE TERMS OF USE SHALL LIMIT OR EXCLUDE OUR LIABILITY FOR FRAUD, OR ANY OTHER LIABILITY THAT CANNOT BE LIMITED OR EXCLUDED UNDER APPLICABLE SOUTH AFRICAN LAW, INCLUDING THE CONSUMER PROTECTION ACT, 2008, WHERE IT APPLIES TO YOU.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">11. INDEMNIFICATION</h4>
            <p className="pt-1">
              You agree to defend, indemnify, and hold us harmless from and against any loss, damage, liability, claim, or demand made by any third party due to or arising out of your use of the Services or your violation of these Terms of Use.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">12. TERM AND TERMINATION</h4>
            <p className="pt-1">
              These Terms of Use remain in effect while you use the Services. We reserve the right to, in our sole discretion and without notice or liability, deny access to and use of the Services (including blocking certain IP addresses) to any person for any reason, including breach of any representation, warranty, or covenant contained in these Terms of Use, or of any applicable law or regulation.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">13. GOVERNING LAW</h4>
            <p className="pt-1">
              These Terms of Use and your use of the Services are governed by and construed in accordance with the laws of the Republic of South Africa, without regard to its conflict of law principles.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">14. DISPUTE RESOLUTION</h4>
            <p className="pt-1">
              Any dispute arising out of or relating to these Terms of Use shall first be attempted to be resolved through good-faith negotiation between the parties. If the dispute cannot be resolved through negotiation, it shall be submitted to the jurisdiction of the courts of the Republic of South Africa.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">15. CORRECTIONS</h4>
            <p className="pt-1">
              There may be information on the Services that contains typographical errors, inaccuracies, or omissions, including descriptions, pricing, availability, and other information relating to local businesses and recommendations. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update the information on the Services at any time, without prior notice.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">16. MISCELLANEOUS</h4>
            <p className="pt-1">
              These Terms of Use and any policies or operating rules posted by us on the Services constitute the entire agreement and understanding between you and us. Our failure to exercise or enforce any right or provision of these Terms of Use shall not operate as a waiver of such right or provision. If any provision of these Terms of Use is determined to be unlawful, void, or unenforceable, that provision is severable from these Terms of Use and does not affect the validity and enforceability of any remaining provisions.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2 bg-slate-900/40 p-4 rounded-xl border border-white/5">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">17. CONTACT US</h4>
            <p>
              In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please contact us at:
            </p>
            <p className="text-xs text-slate-400 font-mono pl-3 border-l-2 border-[#cca472]/30 mt-2">
              BligGroup (Pty) Ltd.<br />
              1 Newport St<br />
              Cape Town, Western Cape 8001<br />
              South Africa
            </p>
            <p className="pt-2 text-xs">
              Email: <strong className="text-[#cca472] hover:underline"><a href="mailto:info@recos.co.za">info@recos.co.za</a></strong>
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 flex justify-end bg-slate-900/10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#cca472] hover:bg-[#d6b384] text-slate-950 text-xs font-bold font-mono tracking-wider cursor-pointer transition-all"
          >
            I UNDERSTAND
          </button>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPolicyModal({ isOpen, onClose }: LegalModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer" 
        onClick={onClose}
      />
      
      {/* Modal Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#cca472]/10 text-[#cca472]">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-white tracking-wide">Privacy Policy</h3>
              <p className="text-[10px] text-slate-500 font-mono">Last updated: June 20, 2026</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Scroll Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed custom-scrollbar text-left font-sans">
          
          <section className="space-y-2">
            <p className="font-semibold text-slate-200">
              Last updated: June 20, 2026
            </p>
            <p>
              This Privacy Notice for BligGroup (Pty) Ltd. (doing business as Recos.co.za) (&quot;<strong>we</strong>&quot;, &quot;<strong>us</strong>&quot;, or &quot;<strong>our</strong>&quot;), describes how and why we might access, collect, store, use, and/or share (&quot;<strong>process</strong>&quot;) your personal information when you use our services (&quot;<strong>Services</strong>&quot;), including when you:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400 text-xs">
              <li>Visit our website at <a href="https://sandtonhotel.recos.co.za" className="text-[#cca472] hover:underline font-bold" target="_blank" rel="noreferrer">https://sandtonhotel.recos.co.za</a> or any website of ours that links to this Privacy Notice</li>
              <li>Use RECOS. Recos is a white-label digital concierge and guest experience platform for hotels. Guests access Recos by scanning a QR code in their room, which opens a web app (no download required) where they can chat directly with the hotel&apos;s front desk/concierge team, view hotel amenities and in-house offerings (e.g. spa, high tea), and discover curated local recommendations (restaurants, attractions, events) near the property. The platform also displays advertising from local businesses relevant to each hotel&apos;s guests. Recos is provided free of charge to hotel partners, with revenue generated through advertising placements from local businesses.</li>
              <li>Engage with us in other related ways, including any marketing or events</li>
            </ul>
            <p className="pt-2">
              <strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <a href="mailto:info@recos.co.za" className="text-[#cca472] hover:underline font-bold font-mono">info@recos.co.za</a>.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-3">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">SUMMARY OF KEY POINTS</h4>
            <p className="italic text-slate-400 text-xs">
              This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by using the table of contents below to find the section you are looking for.
            </p>
            
            <div className="space-y-3 pt-2">
              <p>
                <strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use. Learn more about personal information you disclose to us.
              </p>
              <p>
                <strong>Do we process any sensitive personal information?</strong> Some information may be considered &quot;special&quot; or &quot;sensitive&quot; in certain jurisdictions, for example your racial or ethnic origins, sexual orientation, and religious beliefs. We do not process sensitive personal information.
              </p>
              <p>
                <strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.
              </p>
              <p>
                <strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so. Learn more about how we process your information.
              </p>
              <p>
                <strong>In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific third parties. Learn more about when and with whom we share your personal information.
              </p>
              <p>
                <strong>How do we keep your information safe?</strong> We have adequate organisational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorised third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Learn more about how we keep your information safe.
              </p>
              <p>
                <strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.
              </p>
              <p>
                <strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by contacting us at <a href="mailto:info@recos.co.za" className="text-[#cca472] hover:underline font-bold font-mono">info@recos.co.za</a>. We will consider and act upon any request in accordance with applicable data protection laws.
              </p>
            </div>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">TABLE OF CONTENTS</h4>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-400 text-xs">
              <li><span className="text-slate-300">What Information Do We Collect?</span></li>
              <li><span className="text-slate-300">How Do We Process Your Information?</span></li>
              <li><span className="text-slate-300">When and With Whom Do We Share Your Personal Information?</span></li>
              <li><span className="text-slate-300">What Is Our Stance on Third-Party Websites?</span></li>
              <li><span className="text-slate-300">Do We Offer Artificial Intelligence-Based Products?</span></li>
              <li><span className="text-slate-300">How Long Do We Keep Your Information?</span></li>
              <li><span className="text-slate-300">How Do We Keep Your Information Safe?</span></li>
              <li><span className="text-slate-300">Do We Collect Information From Minors?</span></li>
              <li><span className="text-slate-300">What Are Your Privacy Rights?</span></li>
              <li><span className="text-slate-300">Controls for Do-Not-Track Features</span></li>
              <li><span className="text-slate-300">Do Other Regions Have Specific Privacy Rights?</span></li>
              <li><span className="text-slate-300">Do We Make Updates to This Notice?</span></li>
              <li><span className="text-slate-300">How Can You Contact Us About This Notice?</span></li>
              <li><span className="text-slate-300">How Can You Review, Update, or Delete the Data We Collect From You?</span></li>
            </ol>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">1. WHAT INFORMATION DO WE COLLECT?</h4>
            <p className="font-semibold text-slate-200">Personal information you disclose to us</p>
            <p className="italic text-slate-400 text-xs">In Short: We collect personal information that you provide to us.</p>
            <p>
              We collect personal information that you voluntarily provide to us when you use the Services — for example, when a hotel assigns you access to Recos during your stay, when you chat with hotel staff through the platform, when you express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
            </p>
            <p>
              <strong>Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
              <li>Name (where provided, e.g. via hotel check-in or chat)</li>
              <li>Room number / stay identifier</li>
              <li>Messages sent through the in-app concierge chat</li>
            </ul>
            <p>
              <strong>Account Information.</strong> Guests do not self-register with a username or password. Instead, your access to Recos is automatically provisioned by the hotel based on your room or booking assignment for the duration of your stay. The hotel — not you — creates this access on your behalf.
            </p>
            <p>
              <strong>Sensitive Information.</strong> We do not process sensitive information.
            </p>
            <p>
              All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">2. HOW DO WE PROCESS YOUR INFORMATION?</h4>
            <p className="italic text-slate-400 text-xs">In Short: We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so.</p>
            <p>
              We process your personal information for a variety of reasons, depending on how you interact with our Services, including:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400 text-xs">
              <li>
                <strong>To deliver and facilitate delivery of services to the user.</strong> We may process your information to provide you with the requested service — including the in-app concierge chat and local recommendations.
              </li>
              <li>
                <strong>To respond to user inquiries/offer support to users.</strong> We may process your information to respond to your inquiries and solve any potential issues you might have with the requested service.
              </li>
              <li>
                <strong>To enable user-to-user communications.</strong> We may process your information if you use the concierge chat to communicate with hotel staff.
              </li>
              <li>
                <strong>To protect our Services.</strong> We may process your information as part of our efforts to keep our Services safe and secure, including fraud monitoring and prevention.
              </li>
              <li>
                <strong>To identify usage trends.</strong> We may process information about how you use our Services to better understand how they are being used so we can improve them.
              </li>
              <li>
                <strong>To determine the effectiveness of our marketing and promotional campaigns.</strong> We may process your information to better understand how to provide marketing and promotional campaigns that are most relevant to you, including advertising from local businesses shown through the Services.
              </li>
              <li>
                <strong>To send users marketing and promotional communications.</strong> We may use the personal information you send to us for marketing purposes, where this is in accordance with your communication preferences. You can opt out of our marketing emails at any time by contacting us at <a href="mailto:info@recos.co.za" className="text-[#cca472] hover:underline font-bold font-mono">info@recos.co.za</a>.
              </li>
              <li>
                <strong>To comply with our legal obligations.</strong> We may process your information to comply with our legal obligations, respond to legal requests, and exercise, establish, or defend our legal rights.
              </li>
            </ul>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h4>
            <p className="italic text-slate-400 text-xs">In Short: We may share information in specific situations described in this section and/or with the following third parties.</p>
            <p>We may need to share your personal information in the following situations:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400 text-xs">
              <li>
                <strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
              </li>
              <li>
                <strong>With Hotel Partners.</strong> Your stay-related information (e.g. room number, chat messages directed to hotel staff) is shared with the relevant hotel property to enable them to deliver the concierge service to you.
              </li>
            </ul>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">4. WHAT IS OUR STANCE ON THIRD-PARTY WEBSITES?</h4>
            <p className="italic text-slate-400 text-xs">In Short: We are not responsible for the safety of any information that you share with third parties that we may link to or who advertise on our Services, but are not affiliated with, our Services.</p>
            <p>
              The Services may link to third-party websites, online services, or mobile applications and/or contain advertisements from third parties that are not affiliated with us and which may link to other websites, services, or applications. Accordingly, we do not make any guarantee regarding any such third parties, and we will not be liable for any loss or damage caused by the use of such third-party websites, services, or applications. The inclusion of a link towards a third-party website, service, or application does not imply an endorsement by us. We cannot guarantee the safety and privacy of data you provide to any third-party websites. Any data collected by third parties is not covered by this Privacy Notice. We are not responsible for the content or privacy and security practices and policies of any third parties, including other websites, services, or applications that may be linked to or from the Services. You should review the policies of such third parties and contact them directly to respond to your questions.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">5. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</h4>
            <p className="italic text-slate-400 text-xs">In Short: We offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies.</p>
            <p>
              As part of our Services, we offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies (collectively, &quot;AI Products&quot;). These tools are designed to enhance your experience and provide you with innovative solutions. The terms in this Privacy Notice govern your use of the AI Products within our Services.
            </p>
            <p className="font-semibold text-slate-200">Use of AI Technologies</p>
            <p>
              We provide the AI Products through third-party service providers (&quot;AI Service Providers&quot;), including Google Cloud AI. As outlined in this Privacy Notice, your input, output, and personal information will be shared with and processed by these AI Service Providers to enable your use of our AI Products for purposes outlined in &quot;WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?&quot; You must not use the AI Products in any way that violates the terms or policies of any AI Service Provider.
            </p>
            <p className="font-semibold text-slate-200">Our AI Products</p>
            <p>Our AI Products are designed for the following functions:</p>
            <ul className="list-disc pl-5 text-slate-400 text-xs">
              <li>AI bots</li>
            </ul>
            <p className="font-semibold text-slate-200 pt-1">How We Process Your Data Using AI</p>
            <p>
              All personal information processed using our AI Products is handled in line with our Privacy Notice and our agreement with third parties. This ensures high security and safeguards your personal information throughout the process, giving you peace of mind about your data&apos;s safety.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">6. HOW LONG DO WE KEEP YOUR INFORMATION?</h4>
            <p className="italic text-slate-400 text-xs">In Short: We keep your information for as long as necessary to fulfil the purposes outlined in this Privacy Notice unless otherwise required by law.</p>
            <p>
              We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). No purpose in this notice will require us keeping your personal information for longer than three (3) months past the end of your stay/termination of your access.
            </p>
            <p>
              When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymise such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">7. HOW DO WE KEEP YOUR INFORMATION SAFE?</h4>
            <p className="italic text-slate-400 text-xs">In Short: We aim to protect your personal information through a system of organisational and technical security measures.</p>
            <p>
              We have implemented appropriate and reasonable technical and organisational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorised third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">8. DO WE COLLECT INFORMATION FROM MINORS?</h4>
            <p className="italic text-slate-400 text-xs">In Short: We do not knowingly collect data from or market to children under 18 years of age.</p>
            <p>
              We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent&apos;s use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18, please contact us at <a href="mailto:info@recos.co.za" className="text-[#cca472] hover:underline font-bold font-mono">info@recos.co.za</a>.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">9. WHAT ARE YOUR PRIVACY RIGHTS?</h4>
            <p className="italic text-slate-400 text-xs">In Short: You may review, change, or terminate your access at any time, depending on your country, province, or state of residence.</p>
            <p>
              <strong>Withdrawing your consent:</strong> If we are relying on your consent to process your personal information, which may be express and/or implied consent depending on the applicable law, you have the right to withdraw your consent at any time by contacting us using the contact details provided in the section &quot;HOW CAN YOU CONTACT US ABOUT THIS NOTICE?&quot; below.
            </p>
            <p>
              However, please note that this will not affect the lawfulness of the processing before its withdrawal nor, when applicable law allows, will it affect the processing of your personal information conducted in reliance on lawful processing grounds other than consent.
            </p>
            <p className="font-semibold text-slate-200">Account Information</p>
            <p>
              If you would at any time like to review or change the information associated with your stay, or terminate your access, you can:
            </p>
            <ul className="list-disc pl-5 text-slate-400 text-xs">
              <li>Contact us using the contact information provided in Section 13 below.</li>
            </ul>
            <p>
              Upon your request to terminate your access, we will deactivate or delete your information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.
            </p>
            <p>
              If you have questions or comments about your privacy rights, you may email us at <a href="mailto:info@recos.co.za" className="text-[#cca472] hover:underline font-bold font-mono">info@recos.co.za</a>.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">10. CONTROLS FOR DO-NOT-TRACK FEATURES</h4>
            <p>
              Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track (&quot;DNT&quot;) feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognising and implementing DNT signals has been finalised. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">11. DO OTHER REGIONS HAVE SPECIFIC PRIVACY RIGHTS?</h4>
            <p className="italic text-slate-400 text-xs">In Short: You may have additional rights based on the country you reside in.</p>
            <p className="font-semibold text-slate-200">Republic of South Africa</p>
            <p>
              At any time, you have the right to request access to or correction of your personal information. You can make such a request by contacting us using the contact details provided in Section 13 (&quot;How Can You Contact Us About This Notice?&quot;) and Section 14 (&quot;How Can You Review, Update, or Delete the Data We Collect From You?&quot;) below.
            </p>
            <p>
              If you are unsatisfied with the manner in which we address any complaint with regard to our processing of personal information, you can contact the office of the regulator, the details of which are:
            </p>
            <p className="font-bold text-slate-200">The Information Regulator (South Africa)</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              General enquiries: <a href="mailto:enquiries@inforegulator.org.za" className="text-[#cca472] hover:underline">enquiries@inforegulator.org.za</a><br />
              Complaints (complete POPIA/PAIA form 5): <a href="mailto:PAIAComplaints@inforegulator.org.za" className="text-[#cca472] hover:underline">PAIAComplaints@inforegulator.org.za</a> &amp; <a href="mailto:POPIAComplaints@inforegulator.org.za" className="text-[#cca472] hover:underline">POPIAComplaints@inforegulator.org.za</a>
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">12. DO WE MAKE UPDATES TO THIS NOTICE?</h4>
            <p className="italic text-slate-400 text-xs">In Short: Yes, we will update this notice as necessary to stay compliant with relevant laws.</p>
            <p>
              We may update this Privacy Notice from time to time. The updated version will be indicated by an updated &quot;Revised&quot; date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2 bg-slate-900/40 p-4 rounded-xl border border-white/5">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">13. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h4>
            <p>
              If you have questions or comments about this notice, you may email us at <strong className="text-white hover:underline"><a href="mailto:info@recos.co.za">info@recos.co.za</a></strong> or contact us by post at:
            </p>
            <p className="text-xs text-slate-400 font-mono pl-3 border-l-2 border-[#cca472]/30 mt-2">
              BligGroup (Pty) Ltd.<br />
              1 Newport St<br />
              Cape Town, Western Cape 8001<br />
              South Africa
            </p>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">14. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h4>
            <p>
              Based on the applicable laws of your country, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law.
            </p>
            <p>
              To request to review, update, or delete your personal information, please email us at <strong className="text-white hover:underline"><a href="mailto:info@recos.co.za">info@recos.co.za</a></strong> with the subject line &quot;Data Request&quot; and a description of your request. We will respond to your request in accordance with applicable data protection laws, including POPIA.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 flex justify-end bg-slate-900/10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#cca472] hover:bg-[#d6b384] text-slate-950 text-xs font-bold font-mono tracking-wider cursor-pointer transition-all"
          >
            I UNDERSTAND
          </button>
        </div>
      </div>
    </div>
  );
}
