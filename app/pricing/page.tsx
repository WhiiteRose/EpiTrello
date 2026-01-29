import { PricingTable } from '@/components/pricing-table';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-12 container mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">Select the perfect plan for your needs</p>
        </div>
        <div className="max-w-5xl mx-auto">
          <PricingTable newSubscriptionRedirectUrl="/pricing/success" />
        </div>
      </div>
    </div>
  );
}
