
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { SpiceButton } from '@/components/ui/spice-button';
import { AlertCircle } from 'lucide-react';

interface VerificationWarningProps {
  sellerProfile: any;
}

const VerificationWarning: React.FC<VerificationWarningProps> = ({ sellerProfile }) => {
  const navigate = useNavigate();
  
  if (!sellerProfile || sellerProfile.verification_status === 'approved') {
    return null;
  }
  
  return (
    <Card className="mb-6 bg-yellow-50 border-yellow-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">Verification Pending</h3>
            <p className="text-sm text-yellow-700">
              Your seller profile is awaiting verification. Some features may be limited until verification is complete.
              <SpiceButton 
                variant="ghost" 
                className="p-0 h-auto text-saffron ml-2"
                onClick={() => navigate('/seller/verification')}
              >
                Complete verification
              </SpiceButton>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VerificationWarning;
