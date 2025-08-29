import { useState } from "react";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { HelpCircle, MessageSquare, Mail, Phone } from "lucide-react";

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Support request submitted",
        description: "We'll get back to you as soon as possible."
      });
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
    }, 1000);
  };
  
  return (
    <>
      <Header title="Support" />
      
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Support Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>Fill out the form below to get in touch with our support team</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange}
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        value={formData.email} 
                        onChange={handleChange}
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input 
                      id="subject" 
                      name="subject" 
                      value={formData.subject} 
                      onChange={handleChange}
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <textarea 
                      id="message" 
                      name="message" 
                      value={formData.message} 
                      onChange={handleChange}
                      className="w-full min-h-[150px] p-2 border rounded-md"
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit Request"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
          
          {/* Support Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Support Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <MessageSquare className="w-5 h-5 text-primary mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium">Live Chat</h3>
                    <p className="text-sm text-gray-500">Available Monday-Friday, 9AM-5PM EST</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-primary mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium">Email Support</h3>
                    <p className="text-sm text-gray-500">support@accountflow.com</p>
                    <p className="text-sm text-gray-500">24-48 hour response time</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-primary mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium">Phone Support</h3>
                    <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
                    <p className="text-sm text-gray-500">Available for premium customers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    How do I reset my password?
                  </h3>
                  <p className="text-sm text-gray-500 pl-6">
                    You can reset your password by clicking on the "Forgot Password" link on the login page.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    How do I export my data?
                  </h3>
                  <p className="text-sm text-gray-500 pl-6">
                    You can export your data from the Reports section by clicking on the "Export" button.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Can I cancel my subscription?
                  </h3>
                  <p className="text-sm text-gray-500 pl-6">
                    Yes, you can cancel your subscription from the Billing section in your account settings.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
} 