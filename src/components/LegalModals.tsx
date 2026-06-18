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
              <p className="text-[10px] text-slate-500 font-mono">Last updated: June 2026</p>
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
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">Your Acceptance</h4>
            <p>
              By using or visiting the Recos website or any products, software, data feeds, and services provided to you on, from, or through the Recos website, you signify your agreement to these terms and conditions. If you do not agree to any of these terms, please do not use the Service. This Service is provided by Recos on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis, and Recos reserves the right to modify, suspend, or discontinue the Service, at its sole discretion, at any time and without notice. You agree to be bound by such modifications. Recos is not liable to you for any modification, suspension, or discontinuance of the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">Service</h4>
            <p>
              These Terms of Service apply to all users of the Service, including users who are also contributors of Content on the Service. &quot;Content&quot; may include text, software, graphics, photos, sounds, music, videos, audiovisual combinations, interactive features, and other materials you may view, access through, or contribute to the Service. The Service includes all aspects of Recos, including but not limited to all products, software, and services offered via the Recos website and mobile device applications.
            </p>
            <p>
              The Service may contain links to third-party websites that are not owned or controlled by Recos. Recos has no control over and assumes no responsibility for the content, privacy policies, or practices of any third-party websites. Additionally, Recos will not and cannot censor or edit the content of any third-party site. By using the Service, you expressly relieve Recos from any and all liability arising from your use of any third-party website. Accordingly, we encourage you to be aware when you leave the Service and to read the terms and conditions and privacy policy of each website you visit.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">General Use of the Service – Permissions and Restrictions</h4>
            <p>
              Recos hereby grants you permission to access and use the Service as set forth in these Terms of Service, provided that:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400 text-xs sm:text-[13px]">
              <li>You agree not to distribute in any medium any part of the Service or the Content without Recos&apos;s prior written authorization, unless Recos makes available the means for such distribution through functionality offered by the Service.</li>
              <li>You agree not to alter or modify any part of the Service.</li>
              <li>You agree not to access Content through any technology or means other than the download page of the Service itself or other explicitly authorized means Recos may designate.</li>
              <li>You agree not to use the Service for any commercial uses unless you obtain Recos&apos;s prior written approval, including:
                <ul className="list-[circle] pl-5 mt-1 space-y-1">
                  <li>the sale of access to the Service;</li>
                  <li>the sale of advertising, sponsorships, or promotions placed on or within the Service or Content; or</li>
                  <li>the sale of advertising, sponsorships, or promotions on any page of an ad-enabled blog or website containing Content delivered via the Service, unless other material not obtained from Recos appears on the same page and is of sufficient value to be the basis for such sales.</li>
                </ul>
              </li>
            </ul>

            <p className="pt-1 select-none font-semibold text-slate-200">Prohibited commercial uses do not include:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400 text-xs sm:text-[13px]">
              <li>uploading original material to Recos, or maintaining an original profile on Recos, to promote your business or enterprise;</li>
              <li>any use that Recos expressly authorizes in writing.</li>
            </ul>

            <p>
              You agree not to use or launch any automated system, including without limitation &quot;robots,&quot; &quot;spiders,&quot; or &quot;offline readers,&quot; that accesses the Service in a manner that sends more request messages to the Recos servers in a given period of time than a human can reasonably produce in the same period by using a conventional online web browser.
            </p>
            <p>
              Notwithstanding the foregoing, Recos grants the operators of public search engines permission to use spiders to copy materials from the site for the sole purpose of and solely to the extent necessary for creating publicly available searchable indices of the materials, but not caches or archives. Recos reserves the right to revoke these exceptions either generally or in specific cases.
            </p>
            <p>
              You agree not to collect or harvest any personally identifiable information, including account names, from the Service, nor to use the communication systems provided by the Service (e.g., comments, email) for any commercial solicitation purposes. You agree not to solicit, for commercial purposes, any users of the Service with respect to their Content.
            </p>

            <p className="pt-2 font-semibold text-slate-200">You agree not to create posts, publish, or distribute content on Recos of any kind that is, within the sole discretion of Recos, determined to be commercial, illegal, offensive, or potentially harmful to others including but not limited to content that:</p>
            <ul className="list-decimal pl-5 space-y-1.5 text-slate-400 text-xs">
              <li>Infringes upon the rights of any third party, including copyrights, trademarks, patents, trade secrets, design rights, moral rights, or other proprietary rights, including privacy and publicity rights.</li>
              <li>Promotes the infringement of copyright or other third-party rights.</li>
              <li>Contains improper, incorrect, or misleading content.</li>
              <li>Is duplicated or contains content that already exists on Recos.</li>
              <li>Contains viruses or malicious software.</li>
              <li>Is offensive, abusive, threatening, harassing, stalking, promoting violence, racism, harm, or bigotry.</li>
              <li>Is libelous, defamatory, or knowingly false.</li>
              <li>Violates the privacy of others.</li>
              <li>Solicits information from individuals under the age of 18.</li>
              <li>Is pornographic, sexually explicit, or contains nudity.</li>
              <li>Contains advertisements, solicitations, or commercial material.</li>
              <li>Is unlawful, illegal, or criminal in nature.</li>
            </ul>
            <p>
              In your use of the Service, you will comply with all applicable laws. Recos reserves the right to discontinue any aspect of the Service at any time.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">Your Use of Content</h4>
            <p>
              In addition to the general restrictions above, the following restrictions and conditions apply specifically to your use of Content.
            </p>
            <p>
              All brand, product, and service names used in this Service which identify Recos or third parties and their products and services are proprietary marks of Recos and/or the relevant third parties. Nothing in this Service shall be deemed to confer on any person any license or right on the part of Recos or any third party with respect to any such image, logo, or name.
            </p>
            <p>
              Content is provided to you AS IS. You may access Content for your information and personal use solely as intended through the provided functionality of the Service and as permitted under these Terms of Service. You shall not download any Content unless you see a &quot;download&quot; or similar link displayed by Recos on the Service for that Content.
            </p>
            <p>
              You shall not copy, reproduce, distribute, transmit, broadcast, display, sell, license, or otherwise exploit any Content for any other purposes without prior written consent from Recos or the respective licensors. Recos and its licensors reserve all rights not expressly granted.
            </p>
            <p>
              You agree not to circumvent or interfere with security measures or usage restrictions on the Service. You understand that you may be exposed to Content that is inaccurate, offensive, or objectionable, and you agree to waive any legal rights or remedies against Recos relating to such Content.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">Your Content and Conduct</h4>
            <p>
              As a Recos account holder, you may submit Content to the Service. You understand that Recos does not guarantee confidentiality with respect to any Content you submit. You are solely responsible for your Content and its consequences. You affirm that you own or have licenses to all rights necessary to publish your Content and grant Recos the rights described herein.
            </p>
            <p>
              By submitting Content to Recos, you grant Recos a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform the Content in connection with the Service and Recos&apos;s business.
            </p>
            <p>
              You also grant each user of the Service a non-exclusive license to access and use your Content through the Service.
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
              <p className="text-[10px] text-slate-500 font-mono">Last updated: June 2026</p>
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
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">Introduction</h4>
            <p>
              Recos (&quot;we,&quot; &quot;us&quot; or &quot;our&quot;) takes your privacy seriously. This Privacy Policy (&quot;Privacy Policy&quot;) explains our data protection policy and describes the types of information we may process when you install and/or use our software application for mobile devices (the &quot;App&quot;, &quot;our App&quot;) and explains how we and some of the companies we cooperate with process that information.
            </p>
            <p>
              When we refer to personal data (or personal information), we mean any information relating to a natural person who can be identified directly or indirectly, in particular by reference to such data. It is a natural person who can be identified directly or indirectly, in particular by reference to an identification number or to one or more factors specific to his or her physical, physiological, mental, economic, cultural, or social status.
            </p>
            <p>
              Our Privacy Policy applies to all users and others who access the App (&quot;Users&quot;). For the purposes of the GDPR, we are the data controller, unless otherwise stated.
            </p>
            <p className="font-semibold text-slate-200">
              PLEASE READ THE FOLLOWING PRIVACY POLICY CAREFULLY FOR INFORMATION REGARDING THE WAYS YOUR PERSONAL INFORMATION MAY BE PROCESSED. WHEN YOU USE THE APP YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">How Do We Use Your Information</h4>
            <p>We use the information we collect for various purposes described below:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400 text-xs">
              <li>
                <strong>To provide, maintain, troubleshoot, and support our services:</strong> We use your information for this purpose because it is required to fulfill our contractual obligations to you.
              </li>
              <li>
                <strong>To improve our services:</strong> We want to offer you the best services and user experiences possible, so we have a legitimate interest in continually improving and optimizing our services. We use your information to understand how users interact with our services.
              </li>
              <li>
                <strong>To develop new services:</strong> We have a legitimate interest in using your information to plan for and develop new services. For example, we may use customer feedback to understand what new services users may want.
              </li>
              <li>
                <strong>To market and advertise our services:</strong> We may use your information to provide, measure, personalize, and enhance our advertising and marketing based on our legitimate interest in offering you services that may be of interest.
              </li>
            </ul>

            <p className="pt-1 font-semibold text-slate-200">Examples:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-xs">
              <li>We may use information such as who or what referred you to our services to understand advertising effectiveness.</li>
              <li>We may use information to administer promotional activities such as sweepstakes and referral programs.</li>
            </ul>
            <p>If any new purposes for processing your personal data arise, we will notify you by updating this Privacy Policy.</p>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">Sharing of Your Information</h4>
            <p>
              We will not rent or sell your personal data to any third parties. However, we may share your information from tools like cookies, log files, device identifiers, and location data with third-party organizations that provide automatic data processing technologies for the App.
            </p>
            <p>
              We do not control or influence these third parties&apos; tracking technologies or how they may be used.
            </p>
            <p>
              We do not display third-party ads in our paid products. Ads displayed in our services are supplied by Google (&quot;Google Ads&quot;). To display ads, our App integrates a software development kit (SDK) provided by the ad network.
            </p>
            <p>
              For more information about these services and their privacy options (including opt-out), consult the respective third-party privacy pages. We are not responsible for any usage of your personal data by these third parties in violation of our instructions.
            </p>
            <p>
              Our App may also contain links to third-party sites/services or you may access the App from a third-party site. We are not responsible for the privacy practices of these third-party sites or their content.
            </p>
            <p className="font-semibold text-slate-200">We may disclose your personal information if needed for objective reasons or due to legal obligations:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-xs">
              <li>As required by law</li>
              <li>To protect our rights or safety</li>
              <li>To protect your safety or the safety of others</li>
              <li>To investigate fraud</li>
              <li>To respond to government requests</li>
              <li>If we are involved in a merger, acquisition, or sale of assets</li>
            </ul>
            <p>If such ownership changes, you will be notified via email or through a prominent notice in the App.</p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">How Long We Use Your Personal Data</h4>
            <p>
              We generally retain your personal information as long as necessary to provide the functional service of the App and comply with legal obligations.
            </p>
            <p className="font-semibold text-slate-250">You may request deletion of your data and account. However, some information may still be retained for a limited period if needed to:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
              <li>comply with legal obligations (e.g., tax, accounting, audit)</li>
              <li>maintain safety and backup settings</li>
              <li>prevent fraud or malicious activity.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">Exercising Your Rights</h4>
            <div className="space-y-2 text-xs sm:text-[13px] text-slate-400">
              <p><strong>Data Access and Portability:</strong> You may request copies of your personal information.</p>
              <p><strong>Change or Correct Data:</strong> If you cannot update your data directly through your account, you may request correction, changes, updates, or rectification.</p>
              <p><strong>Data Retention and Deletion:</strong> You may request deletion of your data or close your account. Some data may still be retained where necessary to comply with legal obligations or maintain security.</p>
              <p><strong>Restriction of Processing:</strong> Under certain circumstances, you may restrict how we use your data.</p>
              <p><strong>Direct Marketing Opt-Out:</strong> You may object to your data being processed for direct marketing purposes.</p>
              <p><strong>Device-Level Ad Tracking Controls:</strong> You can disable targeted advertising by choosing: <em>Settings → Privacy → Advertising → Limit Ad Tracking</em> on iOS.</p>
            </div>
            <p className="text-[11px] text-slate-500">Note that opting out does not remove all ads; it removes interest-based ads.</p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">Security</h4>
            <p>
              We take the security of your personal information very seriously. We follow industry standards to protect data during transmission and storage. We take reasonable measures to protect personal data from loss, misuse, unauthorized access, disclosure, alteration, and destruction.
            </p>
            <p className="font-semibold text-slate-200">We implement appropriate technical and organizational measures, including:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
              <li>strong encryption</li>
              <li>data minimization</li>
              <li>secured storage</li>
              <li>access controls</li>
            </ul>
            <p>However, no transmission or storage method is 100% secure. In case of a data breach, we will notify affected users in accordance with applicable law.</p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">Children&apos;s Privacy</h4>
            <p>
              Our App is not intended for children under the age of 4. We do not knowingly collect personal information from children under 4. If we learn that we have unintentionally collected such information, we will delete it as soon as possible. If you believe we may have info about a child under 4, please contact us.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">Changes To The Privacy Policy</h4>
            <p>
              This Privacy Policy will be updated regularly. Any changes will be posted in this Privacy Policy and in other relevant places.
            </p>
          </section>

          <section className="space-y-2 bg-slate-900/40 p-4 rounded-xl border border-white/5">
            <h4 className="text-sm font-bold text-[#cca472] uppercase font-mono tracking-wider">How To Contact Us</h4>
            <p>
              If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:info@recos.co.za" className="text-[#cca472] hover:underline font-bold font-mono">info@recos.co.za</a>
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
