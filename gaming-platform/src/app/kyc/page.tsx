"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import TimeFormatter from "@/components/TimeFormatter";
import { FiCheck, FiX, FiUpload, FiAlertCircle, FiClock } from "react-icons/fi";
import { usePopup } from "@/components/PopupProvider";

type ProviderResp = { enabled: boolean; settings: { provider: string } };

// Country code validation
const validCountryCodes = new Set([
  'NO', 'SE', 'DK', 'FI', 'IS', 'US', 'CA', 'GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'CH', 'AT', 'PL', 'CZ', 'IE', 'PT', 'GR', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE', 'LU', 'MT', 'CY',
  'AU', 'NZ', 'JP', 'KR', 'CN', 'IN', 'SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'BR', 'MX', 'AR', 'CL', 'CO', 'PE', 'ZA', 'EG', 'AE', 'SA', 'IL', 'TR', 'RU'
]);

export default function KycWizardPage() {
  const { data: session } = useSession();
  const { showPopup } = usePopup();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"intro" | "details" | "upload" | "done">("intro");
  const [kycId, setKycId] = useState<string | null>(null);
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { file: File; preview: string }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingVerification, setExistingVerification] = useState<any>(null);

  // Check for existing verification on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/kyc/providers');
        const data: ProviderResp = await res.json();
        setEnabled(!!data?.enabled);
        
        if (data?.enabled) {
          // Check for existing verification
          const statusRes = await fetch('/api/kyc/status');
          const statusData = await statusRes.json();
          if (statusData.verification) {
            setExistingVerification(statusData.verification);
            setKycId(statusData.verification.id);
            setStatus(statusData.verification);
            
            if (statusData.verification.status === 'pending') {
              setStep('upload'); // Resume at upload step if pending
            } else if (statusData.verification.status === 'approved') {
              setStep('done');
            } else if (statusData.verification.status === 'rejected') {
              // Show rejected status but allow resubmission
              setStep('details');
            }
          }
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!kycId) return;
    (async () => {
      const res = await fetch('/api/kyc/status');
      const data = await res.json();
      setStatus(data.verification);
    })();
  }, [kycId]);

  // Calculate progress
  const progress = useMemo(() => {
    switch (step) {
      case 'intro': return 25;
      case 'details': return 50;
      case 'upload': return 75;
      case 'done': return 100;
      default: return 0;
    }
  }, [step]);

  // Validate date of birth
  const validateDOB = (dateString: string): string | null => {
    if (!dateString) return 'Date of birth is required';
    const date = new Date(dateString);
    const now = new Date();
    const age = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    if (age < 18) return 'You must be at least 18 years old';
    if (age > 120) return 'Please enter a valid date of birth';
    if (date > now) return 'Date of birth cannot be in the future';
    return null;
  };

  // Validate country code
  const validateCountry = (code: string): string | null => {
    if (!code) return 'Country code is required';
    if (code.length !== 2) return 'Country code must be 2 letters (e.g., NO, US)';
    if (!validCountryCodes.has(code.toUpperCase())) {
      return 'Please enter a valid ISO country code (e.g., NO, SE, US)';
    }
    return null;
  };

  const canStart = consent && dob && country && !errors.dob && !errors.country;

  const start = async () => {
    // Validate before starting
    const dobError = validateDOB(dob);
    const countryError = validateCountry(country);
    
    setErrors({
      dob: dobError || '',
      country: countryError || ''
    });

    if (dobError || countryError || !consent) {
      showPopup({ 
        type: 'error', 
        message: 'Please fix the errors before continuing. Make sure all fields are filled correctly and you have consented to the processing of your documents.' 
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/kyc/start', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ dob, country: country.toUpperCase() }) 
      });

      // Read response as text first
      const responseText = await res.text();
      
      // Check if response is OK
      if (!res.ok) {
        // Try to parse error message
        let errorMessage = 'Failed to start verification';
        try {
          if (responseText) {
            const errorData = JSON.parse(responseText);
            // Use the user-friendly message from API if available
            errorMessage = errorData.message || errorData.error || errorMessage;
            
            // In development, log full error details
            if (process.env.NODE_ENV === 'development' && errorData.details) {
              console.error('API error details:', errorData.details);
            }
          } else {
            // If no response text, use status-based messages
            errorMessage = res.status === 403 
              ? 'Identity verification is currently disabled. Please contact support if you believe this is an error.'
              : res.status === 401
              ? 'You must be logged in to start verification. Please refresh the page and try again.'
              : res.status === 500
              ? 'A server error occurred. Please try again in a few moments. If the problem persists, contact support.'
              : `Failed to start verification (${res.status}). Please try again or contact support.`;
          }
        } catch (parseError) {
          // If JSON parsing fails, use status text or default message
          errorMessage = responseText || (res.status === 500
            ? 'A server error occurred. Please try again in a few moments. If the problem persists, contact support.'
            : `Failed to start verification (${res.status}). Please try again or contact support.`);
        }
        throw new Error(errorMessage);
      }

      // Parse response JSON (only if res.ok is true)
      let data;
      try {
        if (!responseText) {
          throw new Error('Server returned an empty response. Please try again or contact support if the problem persists.');
        }
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Server returned an invalid response. Please try again or contact support if the problem persists.');
      }

      // Validate response structure
      if (!data || !data.verification || !data.verification.id) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response from server. Please try again or contact support if the problem persists.');
      }

      // Handle existing verification message
      if (data.message && data.message.includes('already have a pending')) {
        showPopup({ 
          type: 'info', 
          message: 'You already have a pending verification. Continuing with your existing submission...' 
        });
      }

      setKycId(data.verification.id);
      setStep('upload');
      showPopup({ 
        type: 'success', 
        message: data.message || 'Verification started successfully! Please upload your ID documents.' 
      });
    } catch (e: any) {
      const errorMessage = e?.message || 'An unexpected error occurred. Please try again or contact support if the problem persists.';
      showPopup({ 
        type: 'error', 
        message: errorMessage
      });
      console.error('KYC start error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const uploadOne = async (file: File, kind: string) => {
    if (!kycId) {
      throw new Error('Verification session expired. Please refresh the page and try again.');
    }
    
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload an image file (JPG, PNG, etc.). Other file types are not supported.');
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the 10MB limit. Please compress or choose a smaller image.`);
    }

    // Request presigned URL
    let pres, pdata;
    try {
      console.log('[KYC Upload] Requesting presigned URL for:', { kycId, kind, contentType: file.type });
      
      pres = await fetch('/api/kyc/upload-url', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ kycId, kind, contentType: file.type || 'application/octet-stream' }) 
      }).catch((fetchError) => {
        console.error('[KYC Upload] Network error requesting upload URL:', fetchError);
        throw new Error('Network error: Could not connect to server. Please check your internet connection and try again.');
      });

      console.log('[KYC Upload] Upload URL response status:', pres.status, pres.ok);

      if (!pres.ok) {
        let errorMsg = 'Failed to prepare upload';
        try {
          const responseText = await pres.text();
          if (responseText) {
            const errorData = JSON.parse(responseText);
            errorMsg = errorData.message || errorData.error || errorMsg;
            console.error('[KYC Upload] API error:', errorData);
          } else {
            errorMsg = pres.status === 401 
              ? 'Your session expired. Please refresh the page and try again.'
              : pres.status === 403
              ? 'You do not have permission to upload documents. Please contact support.'
              : pres.status === 404
              ? 'Verification not found. Please start a new verification.'
              : pres.status === 500
              ? 'Server error occurred. Please try again in a moment.'
              : `Failed to prepare upload (${pres.status}). Please try again.`;
          }
        } catch (parseError) {
          console.error('[KYC Upload] Failed to parse error response:', parseError);
          errorMsg = pres.status === 500
            ? 'Server error occurred. Please try again in a moment.'
            : `Failed to prepare upload (${pres.status}). Please try again.`;
        }
        throw new Error(errorMsg);
      }

      // Parse response
      try {
        const text = await pres.text();
        if (!text) {
          throw new Error('Server returned an empty response');
        }
        pdata = JSON.parse(text);
        console.log('[KYC Upload] Got presigned URL:', { hasUrl: !!pdata.url, hasKey: !!pdata.key });
      } catch (parseError) {
        console.error('[KYC Upload] Failed to parse response:', parseError);
        throw new Error('Server returned an invalid response. Please try again.');
      }

      if (!pdata || !pdata.url || !pdata.key) {
        console.error('[KYC Upload] Invalid upload configuration:', pdata);
        throw new Error('Invalid upload configuration received. Please try again or contact support.');
      }
    } catch (e: any) {
      console.error('[KYC Upload] Error preparing upload:', e);
      throw new Error(e?.message || 'Failed to prepare document upload. Please try again or contact support.');
    }
    
    // PUT to S3
    try {
      console.log('[KYC Upload] Uploading file to S3:', { url: pdata.url?.substring(0, 50) + '...', size: file.size });
      
      const put = await fetch(pdata.url, { 
        method: 'PUT', 
        headers: { 'Content-Type': file.type || 'application/octet-stream' }, 
        body: file 
      }).catch((fetchError) => {
        console.error('[KYC Upload] Network error uploading to S3:', fetchError);
        throw new Error('Network error: Could not upload file to storage. Please check your internet connection and try again.');
      });
      
      console.log('[KYC Upload] S3 upload response status:', put.status, put.ok);
      
      if (!put.ok) {
        const statusText = put.status === 403 
          ? 'Upload permission denied. The upload link may have expired. Please try uploading again.'
          : put.status === 413
          ? 'File is too large. Please compress the image and try again.'
          : put.status === 400
          ? 'Invalid upload request. Please try selecting the file again.'
          : 'Failed to upload file to storage. Please check your internet connection and try again.';
        console.error('[KYC Upload] S3 upload failed:', put.status, statusText);
        throw new Error(statusText);
      }
      
      console.log('[KYC Upload] File uploaded to S3 successfully');
    } catch (e: any) {
      console.error('[KYC Upload] Error uploading to S3:', e);
      if (e?.message) throw e;
      throw new Error('Failed to upload file. Please check your internet connection and try again.');
    }
    
    // Register evidence
    try {
      console.log('[KYC Upload] Registering evidence:', { kycId, kind, storageKey: pdata.key });
      
      const ev = await fetch('/api/kyc/evidence', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ kycId, kind, storageKey: pdata.key, storageProvider: pdata.storageProvider }) 
      }).catch((fetchError) => {
        console.error('[KYC Upload] Network error registering evidence:', fetchError);
        throw new Error('Network error: Could not register document. Please try again.');
      });

      console.log('[KYC Upload] Evidence registration response status:', ev.status, ev.ok);

      if (!ev.ok) {
        let errorMsg = 'Failed to register document';
        try {
          const responseText = await ev.text();
          if (responseText) {
            const errorData = JSON.parse(responseText);
            errorMsg = errorData.message || errorData.error || errorMsg;
            console.error('[KYC Upload] Evidence registration API error:', errorData);
          } else {
            errorMsg = ev.status === 400
              ? 'Document registration failed. Please try uploading again.'
              : ev.status === 404
              ? 'Verification not found. Please refresh the page and try again.'
              : ev.status === 500
              ? 'Server error occurred. Please try again in a moment.'
              : `Failed to register document (${ev.status}). Please try again.`;
          }
        } catch (parseError) {
          console.error('[KYC Upload] Failed to parse evidence registration error:', parseError);
          errorMsg = ev.status === 500
            ? 'Server error occurred. Please try again in a moment.'
            : `Failed to register document (${ev.status}). Please try again.`;
        }
        throw new Error(errorMsg);
      }
      
      console.log('[KYC Upload] Evidence registered successfully');
    } catch (e: any) {
      console.error('[KYC Upload] Error registering evidence:', e);
      if (e?.message) throw e;
      throw new Error('Failed to register document. Please try again or contact support.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, kind: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      showPopup({ 
        type: 'error', 
        message: 'Please upload an image file (JPG, PNG, WebP, etc.). Other file types are not supported.' 
      });
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      showPopup({ 
        type: 'error', 
        message: `File size (${fileSizeMB}MB) exceeds the 10MB limit. Please compress the image or choose a smaller file.` 
      });
      e.target.value = '';
      return;
    }

    // Create preview with error handling
    const reader = new FileReader();
    reader.onerror = () => {
      showPopup({ 
        type: 'error', 
        message: 'Failed to read the file. Please try selecting the file again.' 
      });
      e.target.value = '';
    };
    reader.onloadend = () => {
      if (reader.result) {
        setUploadedFiles(prev => ({
          ...prev,
          [kind]: { file, preview: reader.result as string }
        }));
      } else {
        showPopup({ 
          type: 'error', 
          message: 'Failed to create preview. Please try selecting the file again.' 
        });
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async (kind: string) => {
    if (!kycId) {
      showPopup({ 
        type: 'error', 
        message: 'Verification session expired. Please refresh the page and start over.' 
      });
      return;
    }

    if (!uploadedFiles[kind]) {
      showPopup({ 
        type: 'error', 
        message: 'Please select a file before uploading.' 
      });
      return;
    }
    
    setSubmitting(true);
    try {
      await uploadOne(uploadedFiles[kind].file, kind);
      
      // Fetch updated status
      try {
        const st = await fetch('/api/kyc/status');
        if (st.ok) {
          try {
            const text = await st.text();
            if (text) {
              const data = JSON.parse(text);
              setStatus(data.verification);
            }
          } catch (parseError) {
            console.error('Failed to parse status response:', parseError);
          }
        }
      } catch (statusError) {
        // Status fetch failure is non-critical, just log it
        console.error('Failed to fetch status after upload:', statusError);
      }

      // Show success with document type
      const docType = kind === 'front' ? 'Front of ID' : kind === 'back' ? 'Back of ID' : 'Selfie';
      showPopup({ 
        type: 'success', 
        message: `${docType} uploaded successfully! You can continue uploading other documents or finish when ready.` 
      });
      
      // Remove the file from preview since it's uploaded
      setUploadedFiles(prev => {
        const next = { ...prev };
        delete next[kind];
        return next;
      });
    } catch (err: any) {
      // Error messages from uploadOne are already detailed
      const errorMessage = err?.message || 'Document upload failed. Please check your internet connection and try again.';
      showPopup({ 
        type: 'error', 
        message: errorMessage
      });
      console.error('Upload error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = () => {
    const required = ['front'];
    const uploaded = Object.keys(uploadedFiles);
    const missing = required.filter(k => !uploaded.includes(k));
    
    if (missing.length > 0) {
      showPopup({ 
        type: 'error', 
        message: 'Please upload at least the front of your ID before finishing.' 
      });
      return;
    }

    setStep('done');
    showPopup({ 
      type: 'success', 
      message: 'Your documents have been submitted! We will review them shortly.' 
    });
  };

  // Check if all required documents are uploaded
  const hasRequiredDocuments = useMemo(() => {
    if (!status?.evidences) return false;
    const evidenceKinds = status.evidences.map((e: any) => e.kind);
    return evidenceKinds.includes('id_front');
  }, [status]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading...</p>
        </div>
      </main>
    );
  }

  if (!enabled) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Verification Unavailable</h1>
          <p className="text-neutral-400">Identity verification is currently disabled.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white py-10 px-4">
      <div className="max-w-xl mx-auto bg-neutral-900 rounded-xl border border-neutral-800 p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Verify Your Identity</h1>
          {/* Progress Indicator */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-neutral-400">Progress</span>
              <span className="text-xs text-neutral-400">{progress}%</span>
            </div>
            <div className="w-full bg-neutral-800 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-neutral-500">
              <span className={step === 'intro' ? 'text-purple-400 font-semibold' : ''}>Introduction</span>
              <span className={step === 'details' ? 'text-purple-400 font-semibold' : ''}>Details</span>
              <span className={step === 'upload' ? 'text-purple-400 font-semibold' : ''}>Upload</span>
              <span className={step === 'done' ? 'text-purple-400 font-semibold' : ''}>Complete</span>
            </div>
          </div>
        </div>

        {/* Existing verification status */}
        {existingVerification && existingVerification.status !== 'pending' && (
          <div className={`rounded-lg p-4 ${
            existingVerification.status === 'approved' 
              ? 'bg-green-900/30 border border-green-700'
              : 'bg-red-900/30 border border-red-700'
          }`}>
            <div className="flex items-start gap-3">
              {existingVerification.status === 'approved' ? (
                <FiCheck className="text-green-400 text-xl mt-0.5" />
              ) : (
                <FiX className="text-red-400 text-xl mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">
                  {existingVerification.status === 'approved' 
                    ? 'Identity Already Verified' 
                    : 'Previous Verification Rejected'}
                </h3>
                <p className="text-sm text-neutral-300">
                  {existingVerification.status === 'approved' 
                    ? 'Your identity has been verified. You can make deposits, withdrawals, and join matches with buy-in.'
                    : existingVerification.reason
                    ? `Your previous verification was rejected: ${existingVerification.reason}. You can submit a new verification below.`
                    : 'Your previous verification was rejected. You can submit a new verification below.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'intro' && (
          <div className="space-y-4">
            <div className="bg-neutral-800 rounded-lg p-4 space-y-3">
              <h2 className="font-semibold text-white">What you'll need:</h2>
              <ul className="space-y-2 text-sm text-neutral-300 list-disc list-inside">
                <li>A valid government-issued ID (passport, national ID, or driver's license)</li>
                <li>A clear photo of the front of your ID</li>
                <li>A clear photo of the back of your ID (if applicable)</li>
                <li>A selfie with your ID (optional but recommended)</li>
              </ul>
            </div>
            <p className="text-neutral-300 text-sm">
              To comply with regulations, we may need to verify your age and identity. Your documents are stored securely and only reviewed by authorized staff.
            </p>
            <button 
              onClick={() => setStep('details')} 
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-white">Personal Information</h2>
            <div>
              <label className="block text-sm font-medium mb-2">
                Date of Birth <span className="text-red-400">*</span>
              </label>
              <input 
                type="date" 
                value={dob} 
                onChange={(e) => {
                  setDob(e.target.value);
                  const error = validateDOB(e.target.value);
                  setErrors(prev => ({ ...prev, dob: error || '' }));
                }}
                className={`w-full bg-neutral-800 border rounded px-3 py-2 ${
                  errors.dob ? 'border-red-500' : 'border-neutral-700'
                } focus:outline-none focus:border-purple-500`}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.dob && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <FiAlertCircle className="text-xs" /> {errors.dob}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Country Code (ISO 3166-1 alpha-2) <span className="text-red-400">*</span>
              </label>
              <input 
                type="text" 
                placeholder="e.g., NO, SE, US" 
                value={country} 
                onChange={(e) => {
                  const upper = e.target.value.toUpperCase().slice(0, 2);
                  setCountry(upper);
                  const error = validateCountry(upper);
                  setErrors(prev => ({ ...prev, country: error || '' }));
                }}
                className={`w-full bg-neutral-800 border rounded px-3 py-2 uppercase ${
                  errors.country ? 'border-red-500' : 'border-neutral-700'
                } focus:outline-none focus:border-purple-500`}
                maxLength={2}
              />
              {errors.country && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <FiAlertCircle className="text-xs" /> {errors.country}
                </p>
              )}
              <p className="mt-1 text-xs text-neutral-400">
                Enter your country's 2-letter code (e.g., NO for Norway, US for United States)
              </p>
            </div>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input 
                type="checkbox" 
                checked={consent} 
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1"
              />
              <span className="text-neutral-300">
                I consent to the processing of my documents for verification purposes. <span className="text-red-400">*</span>
              </span>
            </label>
            <button 
              disabled={!canStart || submitting} 
              onClick={start} 
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {submitting ? 'Starting...' : 'Start Verification'}
            </button>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-white mb-2">Upload Documents</h2>
              <p className="text-neutral-300 text-sm mb-4">
                Upload clear photos of your ID. Accepted formats: passport, national ID, or driver's license.
              </p>
            </div>
            
            {/* Front of ID */}
            <div className="border border-neutral-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">
                  Front of ID <span className="text-red-400">*</span>
                </label>
                {uploadedFiles.front && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <FiCheck /> Uploaded
                  </span>
                )}
              </div>
              {uploadedFiles.front && (
                <div className="relative w-full h-48 bg-neutral-800 rounded-lg overflow-hidden mb-2">
                  <img 
                    src={uploadedFiles.front.preview} 
                    alt="Front of ID preview" 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, 'front')} 
                className="block w-full text-sm text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                disabled={submitting}
              />
              {uploadedFiles.front && (
                <button
                  onClick={() => handleFileUpload('front')}
                  disabled={submitting}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-sm disabled:opacity-50"
                >
                  {submitting ? 'Uploading...' : 'Upload Front of ID'}
                </button>
              )}
            </div>

            {/* Back of ID */}
            <div className="border border-neutral-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">
                  Back of ID <span className="text-neutral-500 text-xs">(if applicable)</span>
                </label>
                {uploadedFiles.back && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <FiCheck /> Uploaded
                  </span>
                )}
              </div>
              {uploadedFiles.back && (
                <div className="relative w-full h-48 bg-neutral-800 rounded-lg overflow-hidden mb-2">
                  <img 
                    src={uploadedFiles.back.preview} 
                    alt="Back of ID preview" 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, 'back')} 
                className="block w-full text-sm text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                disabled={submitting}
              />
              {uploadedFiles.back && (
                <button
                  onClick={() => handleFileUpload('back')}
                  disabled={submitting}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-sm disabled:opacity-50"
                >
                  {submitting ? 'Uploading...' : 'Upload Back of ID'}
                </button>
              )}
            </div>

            {/* Selfie */}
            <div className="border border-neutral-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">
                  Selfie with ID <span className="text-neutral-500 text-xs">(optional)</span>
                </label>
                {uploadedFiles.selfie && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <FiCheck /> Uploaded
                  </span>
                )}
              </div>
              {uploadedFiles.selfie && (
                <div className="relative w-full h-48 bg-neutral-800 rounded-lg overflow-hidden mb-2">
                  <img 
                    src={uploadedFiles.selfie.preview} 
                    alt="Selfie preview" 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, 'selfie')} 
                className="block w-full text-sm text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                disabled={submitting}
              />
              {uploadedFiles.selfie && (
                <button
                  onClick={() => handleFileUpload('selfie')}
                  disabled={submitting}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-sm disabled:opacity-50"
                >
                  {submitting ? 'Uploading...' : 'Upload Selfie'}
                </button>
              )}
            </div>

            {/* Status display */}
            {status && (
              <div className={`rounded-lg p-4 ${
                status.status === 'pending' 
                  ? 'bg-yellow-900/30 border border-yellow-700'
                  : status.status === 'approved'
                  ? 'bg-green-900/30 border border-green-700'
                  : status.status === 'rejected'
                  ? 'bg-red-900/30 border border-red-700'
                  : 'bg-neutral-800 border border-neutral-700'
              }`}>
                <div className="flex items-start gap-3">
                  {status.status === 'pending' ? (
                    <FiClock className="text-yellow-400 text-xl mt-0.5" />
                  ) : status.status === 'approved' ? (
                    <FiCheck className="text-green-400 text-xl mt-0.5" />
                  ) : status.status === 'rejected' ? (
                    <FiX className="text-red-400 text-xl mt-0.5" />
                  ) : null}
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">
                      Status: <span className="capitalize">{status.status}</span>
                    </div>
                    <div className="text-sm text-neutral-300">
                      <div>Submitted: <TimeFormatter date={status.createdAt} /></div>
                      {status.decidedAt && (
                        <div>Decided: <TimeFormatter date={status.decidedAt} /></div>
                      )}
                      {status.reason && (
                        <div className="mt-2 text-red-400">Reason: {status.reason}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => setStep('details')} 
                className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button 
                onClick={handleFinish}
                disabled={!hasRequiredDocuments || submitting}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {hasRequiredDocuments ? 'Finish' : 'Upload at least Front of ID'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <FiCheck className="text-white text-3xl" />
            </div>
            <h2 className="text-xl font-semibold">Documents Submitted</h2>
            <p className="text-neutral-300 text-sm">
              We will review your documents shortly. You'll be notified when a decision is made, typically within 1-2 business days.
            </p>
            {status && (
              <div className="bg-neutral-800 rounded-lg p-4 mt-4">
                <div className="text-sm text-neutral-300">
                  <div>Status: <span className="font-semibold capitalize text-white">{status.status}</span></div>
                  <div className="mt-1">Submitted: <TimeFormatter date={status.createdAt} /></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
