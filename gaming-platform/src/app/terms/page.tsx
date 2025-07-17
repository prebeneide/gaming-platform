export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8 text-center">Terms of Service</h1>
        
        <div className="max-w-4xl mx-auto space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-pink-400">1. Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing and using GameChallenger, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-pink-400">2. Use License</h2>
            <p className="text-gray-300 leading-relaxed">
              Permission is granted to temporarily download one copy of the materials on GameChallenger for personal, non-commercial transitory viewing only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-pink-400">3. User Conduct</h2>
            <p className="text-gray-300 leading-relaxed">
              Users must not engage in any activity that interferes with or disrupts the service, including but not limited to cheating, harassment, or fraudulent activities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-pink-400">4. Payment and Prizes</h2>
            <p className="text-gray-300 leading-relaxed">
              All payments and prizes are subject to our payment terms. Winners will receive their prizes through our secure payment system within 7 business days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-pink-400">5. Privacy</h2>
            <p className="text-gray-300 leading-relaxed">
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-pink-400">6. Disclaimer</h2>
            <p className="text-gray-300 leading-relaxed">
              The materials on GameChallenger are provided on an 'as is' basis. GameChallenger makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-pink-400">7. Limitations</h2>
            <p className="text-gray-300 leading-relaxed">
              In no event shall GameChallenger or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on GameChallenger.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-pink-400">8. Revisions and Errata</h2>
            <p className="text-gray-300 leading-relaxed">
              The materials appearing on GameChallenger could include technical, typographical, or photographic errors. GameChallenger does not warrant that any of the materials on its website are accurate, complete or current.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-pink-400">9. Links</h2>
            <p className="text-gray-300 leading-relaxed">
              GameChallenger has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by GameChallenger of the site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-pink-400">10. Modifications</h2>
            <p className="text-gray-300 leading-relaxed">
              GameChallenger may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these Terms and Conditions of Use.
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 