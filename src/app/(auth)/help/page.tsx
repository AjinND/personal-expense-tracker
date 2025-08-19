// src/app/(auth)/help/page.tsx
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthGuard';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  FileText,
  Video,
  Users,
  ExternalLink,
  Send,
  CheckCircle,
  ChevronRight,
  Clock,
  Book
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const faqData = [
  {
    id: '1',
    question: 'How do I add a new expense?',
    answer: 'You can add a new expense from the dashboard by clicking the "Add Expense" button on any category card, or by going to the Expenses page and clicking "Add Expense". Fill in the amount, select the category, and choose the date.',
    category: 'Basic Usage'
  },
  {
    id: '2',
    question: 'How do I set up my monthly budget?',
    answer: 'Navigate to the Budget page and click the edit icon next to your monthly budget amount. Enter your desired budget and click save. You can also set individual category budgets for better tracking.',
    category: 'Budget Management'
  },
  {
    id: '3',
    question: 'Can I export my expense data?',
    answer: 'Yes! You can export your data from the Expenses or Analytics pages by clicking the "Export" button. You can choose between CSV, Excel, or PDF formats.',
    category: 'Data Management'
  },
  {
    id: '4',
    question: 'How do I delete an expense?',
    answer: 'Go to the Expenses page, find the expense you want to delete, and click the trash icon. Confirm the deletion when prompted. Note that this action cannot be undone.',
    category: 'Basic Usage'
  },
  {
    id: '5',
    question: 'What are the different expense categories?',
    answer: 'We have four main categories: Food (meals, groceries), Shopping (clothes, electronics), Travelling (transport, trips), and Entertainment (movies, games). You can track expenses across multiple categories.',
    category: 'Categories'
  },
  {
    id: '6',
    question: 'How do I change my password?',
    answer: 'Go to your Profile page, click on the Security tab, and click "Change Password". Enter your current password and your new password twice to confirm.',
    category: 'Account'
  },
  {
    id: '7',
    question: 'How can I view my spending trends?',
    answer: 'Visit the Analytics page to see detailed charts and insights about your spending patterns, including monthly trends, category distribution, and comparisons.',
    category: 'Analytics'
  },
  {
    id: '8',
    question: 'Is my data secure?',
    answer: 'Yes! We use industry-standard encryption to protect your data. All communications are secured with HTTPS, and your password is encrypted before storage.',
    category: 'Security'
  }
];

const supportChannels = [
  {
    icon: MessageCircle,
    title: 'Live Chat',
    description: 'Get instant help from our support team',
    status: 'Available 9 AM - 6 PM EST',
    available: true,
    action: 'Start Chat'
  },
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Send us a detailed message',
    status: 'Response within 24 hours',
    available: true,
    action: 'Send Email'
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Talk to our experts directly',
    status: 'Available Mon-Fri 9 AM - 5 PM EST',
    available: false,
    action: 'Call Now'
  }
];

const helpResources = [
  {
    icon: FileText,
    title: 'User Guide',
    description: 'Complete guide to using Expense Tracker',
    link: '#'
  },
  {
    icon: Video,
    title: 'Video Tutorials',
    description: 'Step-by-step video walkthroughs',
    link: '#'
  },
  {
    icon: Users,
    title: 'Community Forum',
    description: 'Connect with other users',
    link: '#'
  },
  {
    icon: Book,
    title: 'API Documentation',
    description: 'For developers and integrations',
    link: '#'
  }
];

export default function HelpPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  });

  if (!user) return null;

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in both subject and message',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Message Sent',
        description: 'We\'ll get back to you within 24 hours',
      });
      
      setContactForm({ subject: '', message: '', priority: 'medium' });
      setIsContactDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(faqData.map(faq => faq.category)))];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & Support"
        description="Find answers, get support, and learn how to make the most of Expense Tracker"
        icon={HelpCircle}
      />

      {/* Search Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {helpResources.map((resource, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <resource.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{resource.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                  <Button variant="link" className="p-0 h-auto mt-2 text-blue-600">
                    Learn more
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFAQs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredFAQs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2 flex-1">
                      <span>{faq.question}</span>
                      <Badge variant="secondary" className="ml-auto mr-2">
                        {faq.category}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No matching questions found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your search or browse all categories
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Support Channels */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Get in Touch</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {supportChannels.map((channel, index) => (
            <Card key={index} className={!channel.available ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${channel.available ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <channel.icon className={`h-5 w-5 ${channel.available ? 'text-green-600' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{channel.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{channel.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {channel.status}
                      </span>
                      {channel.available && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <Button 
                      className="w-full mt-3" 
                      variant={channel.available ? "default" : "secondary"}
                      disabled={!channel.available}
                      onClick={() => {
                        if (channel.title === 'Email Support') {
                          setIsContactDialogOpen(true);
                        } else {
                          toast({
                            title: channel.title,
                            description: channel.available 
                              ? `${channel.title} initiated` 
                              : 'This channel is currently unavailable',
                          });
                        }
                      }}
                    >
                      {channel.action}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send us a message</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleContactSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={contactForm.priority} 
                  onValueChange={(value) => setContactForm({ ...contactForm, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Describe your issue in detail..."
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsContactDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Additional Help */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900">Need more help?</h3>
              <p className="text-blue-700 mt-1">
                Can't find what you're looking for? Our support team is here to help you.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button 
                  variant="default" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsContactDialogOpen(true)}
                >
                  Contact Support
                </Button>
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  <Book className="h-4 w-4 mr-2" />
                  Browse Documentation
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}