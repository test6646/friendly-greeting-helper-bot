
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SellerVerification } from '@/interfaces/supabase';
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Upload, 
  FileCheck, 
  AlertTriangle
} from 'lucide-react';

interface VerificationState {
  status: string;
  id_proof_url: string | null;
  address_proof_url: string | null;
  business_certificate_url: string | null;
  selfie_with_id_url: string | null;
  other_documents: any;
  verified_at: string | null;
}

interface SellerVerificationFormProps {
  userId: string;
}

const SellerVerificationForm: React.FC<SellerVerificationFormProps> = ({ userId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [verificationState, setVerificationState] = useState<VerificationState>({
    status: 'pending',
    id_proof_url: null,
    address_proof_url: null,
    business_certificate_url: null,
    selfie_with_id_url: null,
    other_documents: null,
    verified_at: null
  });
  
  // Optional notes field for the seller to add information
  const [notes, setNotes] = useState('');
  
  // Check if seller profile exists and fetch verification state
  useEffect(() => {
    const fetchVerificationStatus = async () => {
      try {
        setLoading(true);
        
        // Check if there's an existing verification record
        const { data, error } = await supabase
          .from('seller_verifications')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" error, which is expected if no verification yet
          throw error;
        }
        
        if (data) {
          setVerificationState({
            status: data.status,
            id_proof_url: data.id_proof_url,
            address_proof_url: data.address_proof_url,
            business_certificate_url: data.business_certificate_url,
            selfie_with_id_url: data.selfie_with_id_url,
            other_documents: data.other_documents,
            verified_at: data.verified_at
          });
          
          // If there are notes in other_documents, check and parse properly
          if (data.other_documents && typeof data.other_documents === 'object') {
            if ('notes' in data.other_documents) {
              setNotes(data.other_documents.notes as string);
            }
          }
        }
        
      } catch (error: any) {
        console.error('Error fetching verification status:', error);
        toast({
          title: 'Error',
          description: 'Failed to load verification status',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchVerificationStatus();
    }
  }, [userId, toast]);
  
  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, documentType: keyof VerificationState) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploading(true);
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${documentType}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `verification-docs/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('seller-verification')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('seller-verification')
        .getPublicUrl(filePath);
      
      // Update the verification state
      const fileUrl = publicUrlData.publicUrl;
      
      setVerificationState(prev => ({
        ...prev,
        [documentType]: fileUrl
      }));
      
      toast({
        title: 'File Uploaded',
        description: 'Document uploaded successfully'
      });

      // Check if both required documents are now uploaded
      if (
        documentType === 'id_proof_url' && verificationState.address_proof_url || 
        documentType === 'address_proof_url' && verificationState.id_proof_url ||
        (verificationState.id_proof_url && verificationState.address_proof_url)
      ) {
        // We have both required documents, auto-approve for testing
        handleAutoApproval();
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload document',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };
  
  // Auto approval function for testing purposes
  const handleAutoApproval = async () => {
    if (!verificationState.id_proof_url || !verificationState.address_proof_url) {
      console.log("Required documents missing, can't auto approve");
      return;
    }
    
    try {
      setLoading(true);
      
      // Auto-approve the verification
      const now = new Date().toISOString();
      
      // Update the seller_verifications table
      const { error: verificationError } = await supabase
        .from('seller_verifications')
        .upsert({
          user_id: userId,
          id_proof_url: verificationState.id_proof_url,
          address_proof_url: verificationState.address_proof_url,
          business_certificate_url: verificationState.business_certificate_url,
          selfie_with_id_url: verificationState.selfie_with_id_url,
          other_documents: { notes },
          status: 'approved',
          verified_at: now
        });
      
      if (verificationError) throw verificationError;
      
      // Also update seller_profiles verification status
      const { error: profileError } = await supabase
        .from('seller_profiles')
        .update({ verification_status: 'approved' })
        .eq('user_id', userId);
      
      if (profileError) throw profileError;
      
      // Update local state
      setVerificationState(prev => ({
        ...prev,
        status: 'approved',
        verified_at: now
      }));
      
      toast({
        title: 'Verification Approved',
        description: 'Your seller account has been automatically verified for testing purposes.'
      });
      
    } catch (error: any) {
      console.error('Error auto-approving verification:', error);
      toast({
        title: 'Auto-Approval Failed',
        description: error.message || 'Failed to auto-approve verification',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle submit verification documents
  const handleSubmit = async () => {
    // Check required docs
    if (!verificationState.id_proof_url || !verificationState.address_proof_url) {
      toast({
        title: 'Missing Documents',
        description: 'Please upload both ID proof and address proof documents',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // For testing purposes: Auto-approve the verification
      await handleAutoApproval();
      
    } catch (error: any) {
      console.error('Error submitting verification:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit verification documents',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to render status badge
  const renderStatusBadge = () => {
    switch(verificationState.status) {
      case 'pending':
        return (
          <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
            <Clock className="h-4 w-4 mr-1" />
            Pending Review
          </div>
        );
      case 'approved':
        return (
          <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            <CheckCircle className="h-4 w-4 mr-1" />
            Verified
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
            <XCircle className="h-4 w-4 mr-1" />
            Rejected
          </div>
        );
      default:
        return (
          <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Not Submitted
          </div>
        );
    }
  };
  
  // Render document upload UI
  const renderDocumentUpload = (
    label: string,
    description: string,
    documentType: keyof VerificationState,
    required: boolean = false
  ) => {
    const documentUrl = verificationState[documentType] as string | null;
    
    return (
      <div className="space-y-2">
        <Label className="flex items-center">
          {label} {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <p className="text-xs text-gray-500 mb-2">{description}</p>
        
        {documentUrl ? (
          <div className="flex items-center rounded-md border border-gray-300 p-3 bg-gray-50">
            <FileCheck className="h-5 w-5 text-green-500 mr-2" />
            <div className="flex-grow overflow-hidden">
              <p className="text-sm font-medium truncate">Document uploaded</p>
              <a 
                href={documentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                View document
              </a>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="ml-2"
              onClick={() => {
                const input = document.getElementById(`${documentType}-input`);
                if (input) input.click();
              }}
            >
              Replace
            </Button>
          </div>
        ) : (
          <div 
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => {
              const input = document.getElementById(`${documentType}-input`);
              if (input) input.click();
            }}
          >
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-500">PDF, JPG, PNG (max 5MB)</p>
          </div>
        )}
        
        <input
          id={`${documentType}-input`}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => handleFileUpload(e, documentType)}
          disabled={uploading || loading || verificationState.status === 'approved'}
        />
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-pulse text-primary">Loading verification status...</div>
      </div>
    );
  }
  
  // If already verified, show verification status
  if (verificationState.status === 'approved') {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="bg-green-100 rounded-full p-4 mb-4">
              <ShieldCheck className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">Verification Approved</h3>
            <p className="text-green-700 mb-4">
              Your seller account has been verified. You can now start selling on SheKaTiffin.
            </p>
            
            {verificationState.verified_at && (
              <p className="text-sm text-green-600">
                Verified on {new Date(verificationState.verified_at).toLocaleDateString()}
              </p>
            )}
            
            <Button className="mt-6 bg-primary hover:bg-primary/90">
              Go to Seller Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If verification is in progress or rejected
  return (
    <div className="space-y-8">
      {/* Status Card */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center">
          <div className={`p-3 rounded-full mr-4 ${
            verificationState.status === 'pending' ? 'bg-yellow-100' :
            verificationState.status === 'approved' ? 'bg-green-100' :
            verificationState.status === 'rejected' ? 'bg-red-100' :
            'bg-blue-100'
          }`}>
            <Shield className={`h-6 w-6 ${
              verificationState.status === 'pending' ? 'text-yellow-600' :
              verificationState.status === 'approved' ? 'text-green-600' :
              verificationState.status === 'rejected' ? 'text-red-600' :
              'text-blue-600'
            }`} />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-1">Seller Verification</h3>
            <p className="text-sm text-gray-600">
              {verificationState.status === 'pending' ? 'Your verification is under review' :
               verificationState.status === 'approved' ? 'Your seller account is verified' :
               verificationState.status === 'rejected' ? 'Your verification was rejected' :
               'Submit your documents for verification'}
            </p>
          </div>
        </div>
        
        <div>
          {renderStatusBadge()}
        </div>
      </div>
      
      {/* Verification Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Verification Requirements
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Valid government-issued ID proof (Aadhaar, PAN, Voter ID, etc.)</li>
                <li>Address proof (Utility bill, Rental agreement, etc.)</li>
                <li>Food handling certification (if available)</li>
                <li>FSSAI registration (if applicable)</li>
                <li>Clear photo of your kitchen area (recommended)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Document Upload Form */}
      <div className="space-y-6">
        {renderDocumentUpload(
          "ID Proof",
          "Upload a valid government-issued ID (Aadhaar, PAN, Passport, Voter ID)",
          "id_proof_url",
          true
        )}
        
        {renderDocumentUpload(
          "Address Proof",
          "Upload a document showing your current address (Utility bill, Rental agreement)",
          "address_proof_url",
          true
        )}
        
        {renderDocumentUpload(
          "Business Certificate",
          "Upload FSSAI registration or food business certification if available",
          "business_certificate_url"
        )}
        
        {renderDocumentUpload(
          "Selfie with ID",
          "Upload a photo of yourself holding your ID for verification",
          "selfie_with_id_url"
        )}
        
        <div className="space-y-2">
          <Label htmlFor="notes">Additional Information</Label>
          <Textarea
            id="notes"
            placeholder="Add any additional information that may help with verification..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px]"
            disabled={loading || verificationState.status === 'approved'}
          />
        </div>
        
        <div className="pt-4 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={loading || uploading || !verificationState.id_proof_url || !verificationState.address_proof_url}
            className="bg-primary hover:bg-primary/90"
          >
            {loading || uploading ? "Processing..." : "Submit for Verification"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Define ShieldCheck as it's not available in the imported lucide-react set
const ShieldCheck = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default SellerVerificationForm;
