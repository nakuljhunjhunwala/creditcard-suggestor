import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useSessionStore } from '../store/useSessionStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Upload, FileText, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Initializing Session...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Session: {session.sessionToken.slice(0, 8)}...
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Upload your credit card statement (PDF)</h1>
            <p className="text-muted-foreground">
              Please ensure that the password has been removed from the PDF.
            </p>
          </div>

          {/* Upload Area */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
                  }
                  ${isLoading ? 'pointer-events-none opacity-50' : ''}
                `}
              >
                <input {...getInputProps()} />
                
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <p className="text-lg font-medium">
                        {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
                      </p>
                      <p className="text-muted-foreground mt-2">
                        or click to browse files
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upload Progress */}
          {isLoading && uploadProgress > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Uploading...</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={uploadProgress} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                  {uploadProgress}% uploaded
                </p>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="mb-6 border-destructive">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">Upload Error</p>
                    <p className="text-sm text-muted-foreground">{error.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Button */}
          <div className="text-center">
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || isLoading}
              size="lg"
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Processing...' : 'Submit'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
