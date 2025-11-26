import { X, Check, Crown } from 'lucide-react';

function SubscriptionModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const handleSubscribe = () => {
    // TODO: Implement Stripe/payment integration
    alert('Stripe integration coming soon! You will be redirected to payment.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative bg-gradient-to-br from-dark-800 to-dark-900 border-2 border-primary-500/30 rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Upgrade to Yorru Pro</h2>
          <p className="text-primary-200">Unlock premium features for your events</p>
        </div>

        {/* Pricing */}
        <div className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 border border-primary-500/30 rounded-xl p-6 mb-6">
          <div className="text-center mb-4">
            <div className="text-5xl font-bold text-white mb-2">
              $15<span className="text-2xl text-primary-300">/month</span>
            </div>
            <p className="text-primary-200">Cancel anytime</p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold text-white mb-3">What you'll get:</h3>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-accent-600 rounded-full flex items-center justify-center mt-0.5">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="text-white font-medium">Document Uploads</h4>
              <p className="text-gray-400 text-sm">Upload PDFs, images, and documents for your events. AI will use them for context.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-accent-600 rounded-full flex items-center justify-center mt-0.5">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="text-white font-medium">Enhanced AI Assistant</h4>
              <p className="text-gray-400 text-sm">Get unlimited AI queries and suggestions for your events.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-accent-600 rounded-full flex items-center justify-center mt-0.5">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="text-white font-medium">Advanced Analytics</h4>
              <p className="text-gray-400 text-sm">Track guest responses, preferences, and event insights.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-accent-600 rounded-full flex items-center justify-center mt-0.5">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="text-white font-medium">Priority Support</h4>
              <p className="text-gray-400 text-sm">Get help faster with priority customer support.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-accent-600 rounded-full flex items-center justify-center mt-0.5">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="text-white font-medium">Unlimited Events</h4>
              <p className="text-gray-400 text-sm">Create and manage as many events as you want.</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSubscribe}
            className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition shadow-lg"
          >
            Subscribe Now - $15/month
          </button>
          <button
            onClick={onClose}
            className="w-full bg-dark-700 hover:bg-dark-600 text-gray-300 py-3 px-6 rounded-xl font-semibold transition"
          >
            Maybe Later
          </button>
        </div>

        {/* Fine print */}
        <p className="text-center text-gray-500 text-xs mt-4">
          Secure payment powered by Stripe. Cancel anytime from your account settings.
        </p>
      </div>
    </div>
  );
}

export default SubscriptionModal;
