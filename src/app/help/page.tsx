// src/app/help/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
  CheckCircle
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types/dashboard';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
    answer: 'Go to your Profile page, scroll to the Security section, and click "Change Password". Enter your current password and your new password twice to confirm.',
    category: 'Account'
  }
];

const supportChannels = [
  {
    icon: MessageCircle,
    title: 'Live Chat',
    description: 'Get instant help from our support team',
    status: 'Available 9 AM - 6 PM EST',
    action: 'Start Chat'
  },
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Send us a detailed message',
    status: 'Response within 24 hours',
    action: 'Send Email'
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Talk to our experts directly',
    status: 'Available Mon-Fri 9 AM - 5 PM EST',
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
  }
];

export default function HelpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  });

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

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

  if (loading) {
    return (
      <DashboardLayout user={user || { name: '', email: '' }} onLogout={handleLogout}>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Help & Support</h1>
          <p className="text-lg text-gray-600 mb-8">
            Find answers to common questions or get in touch with our support team
          </p>
          
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 text-lg h-12"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {supportChannels.map((channel) => {
            const Icon = channel.icon;
            return (
              <Card key={channel.title} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{channel.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{channel.description}</p>
                  <Badge variant="secondary" className="mb-4">
                    {channel.status}
                  </Badge>
                  <Button className="w-full">
                    {channel.action}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact Form Dialog */}
        <div className="text-center">
          <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg">
                <Send className="h-4 w-4 mr-2" />
                Send us a Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Contact Support</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Brief description of your issue"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Describe your issue in detail..."
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsContactDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Send Message
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Help Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Help Resources</CardTitle>
            <p className="text-sm text-gray-600">
              Learn more about using Expense Tracker effectively
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {helpResources.map((resource) => {
                const Icon = resource.icon;
                return (
                  <a
                    key={resource.title}
                    href={resource.link}
                    className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
                  >
                    <Icon className="h-6 w-6 text-gray-500 group-hover:text-blue-600" />
                    <div className="flex-1">
                      <h4 className="font-medium group-hover:text-blue-700">{resource.title}</h4>
                      <p className="text-sm text-gray-600">{resource.description}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? 'All Categories' : category}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your search terms or browse different categories
                </p>
                <Button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <Accordion type="single" collapsible className="space-y-2">
                {filteredFAQs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id} className="border border-gray-200 rounded-lg px-4">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <div className="flex items-center justify-between w-full mr-4">
                        <span className="font-medium">{faq.question}</span>
                        <Badge variant="secondary" className="ml-2">
                          {faq.category}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* Still Need Help */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Still need help?
            </h3>
            <p className="text-blue-700 mb-6">
              Our support team is here to help you with any questions or issues you might have.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button>
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Live Chat
              </Button>
              <Button variant="outline" onClick={() => setIsContactDialogOpen(true)}>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status & Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>System Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">All Systems Operational</span>
                </div>
                <Badge variant="secondary">Excellent</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Dashboard</span>
                  <Badge className="bg-green-100 text-green-800">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Expense Tracking</span>
                  <Badge className="bg-green-100 text-green-800">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Data Export</span>
                  <Badge className="bg-green-100 text-green-800">Operational</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}