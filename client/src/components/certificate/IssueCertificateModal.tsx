import { useState } from 'react';
import { InsertCertificate } from '@shared/schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { FileText } from 'lucide-react';

interface IssueCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IssueCertificateModal({ isOpen, onClose }: IssueCertificateModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<Partial<InsertCertificate>>({
    studentName: '',
    studentEmail: '',
    degreeName: '',
    degreeField: '',
    issueDate: new Date().toISOString().split('T')[0], // Today's date
  });

  const issueCertificateMutation = useMutation({
    mutationFn: async (certificate: Partial<InsertCertificate>) => {
      const res = await apiRequest('POST', '/api/certificates', certificate);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Certificate Issued',
        description: 'The certificate has been successfully issued.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates'] });
      onClose();
      setFormData({
        studentName: '',
        studentEmail: '',
        degreeName: '',
        degreeField: '',
        issueDate: new Date().toISOString().split('T')[0],
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to issue certificate: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    issueCertificateMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <FileText className="h-6 w-6 text-primary-600" />
          </div>
          <DialogTitle className="text-center text-lg font-medium">Issue New Certificate</DialogTitle>
          <DialogDescription className="text-center">
            Fill out the details to issue a new certificate. The certificate will be stored securely and a hash will be generated for blockchain verification.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="studentName">Student Name</Label>
              <Input
                id="studentName"
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="studentEmail">Student Email</Label>
              <Input
                id="studentEmail"
                name="studentEmail"
                type="email"
                value={formData.studentEmail}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="degreeName">Degree/Certificate Name</Label>
              <Input
                id="degreeName"
                name="degreeName"
                value={formData.degreeName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="degreeField">Field of Study (Optional)</Label>
              <Input
                id="degreeField"
                name="degreeField"
                value={formData.degreeField}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input
                id="issueDate"
                name="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={issueCertificateMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={issueCertificateMutation.isPending}
            >
              {issueCertificateMutation.isPending ? 'Issuing...' : 'Issue Certificate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
