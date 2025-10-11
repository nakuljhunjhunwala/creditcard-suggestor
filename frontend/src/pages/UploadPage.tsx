import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useSessionStore } from '../store/useSessionStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Upload, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export function UploadPage() {
  const navigate = useNavigate();
  const { sessionToken } = useParams();
  const { 
    session, 
    uploadFile, 
    isLoading, 
    error, 
    uploadProgress,
    clearError,
    createSession 
  } = useSessionStore();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    // If we have a sessionToken but no session, we might need to fetch it
    // For now, we'll create a new session if none exists
    if (sessionToken && !session) {
      // Try to create a session - in a real app you'd validate the token
      createSession();
    } else if (!sessionToken && !session) {
      createSession();
    }
  }, [sessionToken, session, createSession]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      clearError();
      setSelectedFile(file);
    }
  }, [clearError]);

  const onDropRejected = useCallback(() => {
    clearError();
    // Handle rejected files
  }, [clearError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false
  });

  const handleUpload = async () => {
    if (!selectedFile || !session) return;
    
    try {
      await uploadFile(selectedFile);
      // Navigate to processing page after successful upload
      navigate(`/processing/${session.sessionToken}`);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Initializing Session...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white hover:text-gray-300 hover:bg-gray-800 mb-6 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Upload your statement
            </Button>

            {/* PDF Statement Label */}
            <div className="mb-4">
              <label className="text-sm font-medium text-white">
                PDF Statement
              </label>
            </div>

            {/* Upload Area */}
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 mb-6 text-center cursor-pointer transition-all
                ${isDragActive 
                  ? 'border-purple-500 bg-purple-500/10' 
                  : selectedFile 
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                }
                ${isLoading ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <input {...getInputProps()} />
              
              {selectedFile ? (
                <div className="space-y-3">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                  <div>
                    <p className="text-white font-medium">Uploaded</p>
                    <p className="text-gray-400 text-sm mt-1">{selectedFile.name}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-12 w-12 text-gray-500 mx-auto" />
                  <p className="text-gray-400 text-sm">
                    Click to upload PDF (max 10MB)
                  </p>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {isLoading && uploadProgress > 0 && (
              <div className="mb-6">
                <Progress value={uploadProgress} className="mb-2 bg-gray-800" />
                <p className="text-sm text-gray-400 text-center">
                  {uploadProgress}% uploaded
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Upload Error</p>
                    <p className="text-sm text-red-300">{error.message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-semibold py-6 rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Analyze my statement'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
