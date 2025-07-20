import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Send, Upload, Image as ImageIcon, FileText, Bot, User, Table as TableIcon, Code, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { OpenRouterService, OpenRouterMessage } from "@/services/openrouter";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  image?: string;
  isLoading?: boolean;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello Hafeez! I'm your document field extraction assistant. Upload an image or any document whatsoever, and I'll extract all the fields and values for you.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [responseFormat, setResponseFormat] = useState<'natural' | 'json' | 'table'>('natural');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const openRouterService = new OpenRouterService();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result); // Keep the full data URL for image preview
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Please upload an image or PDF file");
      return;
    }

    // Validate file size (5MB limit for better processing)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB for optimal processing");
      return;
    }

    // For PDFs, show a warning about potential processing issues
    if (file.type === "application/pdf") {
      toast.info("PDF processing may take longer. For best results, try converting to an image format (PNG/JPG).");
    }

    try {
      const dataUrl = await convertFileToBase64(file);
      const imageUrl = URL.createObjectURL(file);

      // Add user message with image
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: `Uploaded ${file.type.startsWith("image/") ? "image" : "PDF"}: ${file.name}`,
        timestamp: new Date(),
        image: imageUrl,
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      // Process with OpenRouter - use the data URL directly for Llama 4 Maverick
      const response = await openRouterService.extractFieldsFromImage(
        dataUrl,
        inputValue || undefined
      );

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setInputValue("");
      
      toast.success("Document processed successfully!");
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process document");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Convert messages to OpenRouter format
      const openRouterMessages: OpenRouterMessage[] = messages
        .slice(-10) // Keep last 10 messages for context
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

      // Add current user message
      openRouterMessages.push({
        role: "user",
        content: inputValue.trim(),
      });

      const response = await openRouterService.sendMessage(openRouterMessages);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setInputValue("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const parseResponseToJSON = (content: string): any => {
    try {
      // Try to parse if it's already JSON
      return JSON.parse(content);
    } catch {
      // Extract field-value pairs from natural language response
      const fields: Record<string, any> = {};
      
      // First, extract regular field-value pairs with a more comprehensive pattern
      const lines = content.split('\n');
      
      for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // Skip obviously narrative lines
        if (line.toLowerCase().includes('the image displays') || 
            line.toLowerCase().includes('this document contains') ||
            line.toLowerCase().includes('according to the image')) {
          continue;
        }
        
        // Look for field-value patterns
        const colonMatch = line.match(/^[*\s]*([^:]+):\s*(.+)$/);
        if (colonMatch) {
          let field = colonMatch[1].trim().replace(/\*/g, '');
          let value = colonMatch[2].trim().replace(/\*/g, '');
          
          // Clean field names but preserve meaningful content
          if (field.toLowerCase().includes('quotation') && field.toLowerCase().includes('number')) {
            field = 'Quotation Number';
          } else if (field.toLowerCase().includes('invoice') && field.toLowerCase().includes('number')) {
            field = 'Invoice Number';
          } else if (field.toLowerCase().includes('business') && field.toLowerCase().includes('type')) {
            field = 'Business Type';
          } else if (field.toLowerCase().includes('company') || field.toLowerCase().includes('supplier')) {
            field = 'Company Name';
          } else if (field.toLowerCase().includes('customer') && field.toLowerCase().includes('name')) {
            field = 'Customer Name';
          } else if (field.toLowerCase().includes('vehicle') && field.toLowerCase().includes('registration')) {
            field = 'Vehicle Registration';
          } else if (field.toLowerCase().includes('claim') && field.toLowerCase().includes('number')) {
            field = 'Claim Number';
          } else if (field.toLowerCase().includes('total') && (field.toLowerCase().includes('cost') || field.toLowerCase().includes('amount'))) {
            field = 'Total Cost';
          } else if (field.toLowerCase().includes('mobile') || field.toLowerCase().includes('phone') || field.toLowerCase().includes('contact')) {
            field = 'Phone Number';
          } else if (field.toLowerCase().includes('email')) {
            field = 'Email';
          } else if (field.toLowerCase().includes('address') || field.toLowerCase().includes('location')) {
            field = 'Address';
          } else if (field.toLowerCase().includes('date')) {
            field = 'Date';
          } else if (field.toLowerCase().includes('building') || field.toLowerCase().includes('bldg')) {
            field = 'Building';
          } else if (field.toLowerCase().includes('road') || field.toLowerCase().includes('street')) {
            field = 'Road';
          } else if (field.toLowerCase().includes('block')) {
            field = 'Block';
          } else if (field.toLowerCase().includes('quantity') || field.toLowerCase().includes('qty')) {
            field = 'Quantity';
          } else if (field.toLowerCase().includes('price')) {
            field = 'Price';
          } else if (field.toLowerCase().includes('garage')) {
            field = 'Garage';
          } else {
            // Clean up field name while preserving meaning
            field = field.replace(/[*+\-_]+/g, ' ').trim();
            field = field.split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
          }
          
          if (field && value) {
            fields[field] = value;
          }
        }
      }
      
      // Extract item details separately with more comprehensive patterns
      const itemPatterns = [
        /Item\s+(\d+):\s*([^(]+)\s*\(([^)]+)\)/gi,
        /\+\s*Item\s+(\d+):\s*([^(]+)\s*\(([^)]+)\)/gi,
        /(\d+)\.\s*([^(]+)\s*\(([^)]+)\)/gi
      ];
      
      const items: any[] = [];
      
      for (let pattern of itemPatterns) {
        let itemMatch;
        while ((itemMatch = pattern.exec(content)) !== null) {
          const itemNumber = itemMatch[1];
          const itemName = itemMatch[2].trim();
          const itemDetails = itemMatch[3];
          
          // Parse quantity and price from details
          const quantityMatch = itemDetails.match(/quantity:\s*(\d+)/i);
          const priceMatch = itemDetails.match(/price:\s*([^,]+)/i);
          
          const item: any = {
            name: itemName,
            quantity: quantityMatch ? quantityMatch[1] : '',
            price: priceMatch ? priceMatch[1].trim() : ''
          };
          
          items.push(item);
        }
      }
      
      if (items.length > 0) {
        fields['Items'] = items;
      }
      
      return Object.keys(fields).length > 0 ? fields : { content: content.replace(/\*/g, '').trim() };
    }
  };

  const parseResponseToTable = (content: string): { field: string, value: string }[] => {
    const json = parseResponseToJSON(content);
    const tableRows: { field: string, value: string }[] = [];
    
    if (typeof json === 'object' && json !== null) {
      Object.entries(json).forEach(([field, value]) => {
        if (field === 'Items' && Array.isArray(value)) {
          // Handle items specially - create separate rows for each item
          value.forEach((item: any, index: number) => {
            tableRows.push({
              field: `Item ${index + 1} Name`,
              value: item.name || ''
            });
            if (item.quantity) {
              tableRows.push({
                field: `Item ${index + 1} Quantity`, 
                value: item.quantity
              });
            }
            if (item.price) {
              tableRows.push({
                field: `Item ${index + 1} Price`,
                value: item.price
              });
            }
          });
        } else {
          // Clean field names: remove asterisks, special characters, and make short and meaningful
          let cleanField = field.replace(/\*/g, '').trim();
          
          // Remove leading commas, plus signs, and other special characters
          cleanField = cleanField.replace(/^[,+\-_\s]+/, '').replace(/[,+\-_\s]+$/, '');
          
          // Skip entries that are just long descriptions or narrative text
          if (cleanField.toLowerCase().includes('image') && cleanField.length > 20) {
            return; // Skip this entry
          }
          
          if (cleanField.toLowerCase().includes('document') && cleanField.length > 20) {
            return; // Skip this entry
          }
          
          // Convert verbose field names to clean, short ones
          if (cleanField.toLowerCase().includes('quotation') && cleanField.toLowerCase().includes('number')) {
            cleanField = 'Quotation Number';
          } else if (cleanField.toLowerCase().includes('invoice') && cleanField.toLowerCase().includes('number')) {
            cleanField = 'Invoice Number';
          } else if (cleanField.toLowerCase().includes('order') && cleanField.toLowerCase().includes('number')) {
            cleanField = 'Order Number';
          } else if (cleanField.toLowerCase().includes('company') && cleanField.toLowerCase().includes('name')) {
            cleanField = 'Company Name';
          } else if (cleanField.toLowerCase().includes('supplier') && cleanField.toLowerCase().includes('name')) {
            cleanField = 'Supplier Name';
          } else if (cleanField.toLowerCase().includes('customer') && cleanField.toLowerCase().includes('name')) {
            cleanField = 'Customer Name';
          } else if (cleanField.toLowerCase().includes('total') && cleanField.toLowerCase().includes('amount')) {
            cleanField = 'Total Amount';
          } else if (cleanField.toLowerCase().includes('mobile') || cleanField.toLowerCase().includes('phone')) {
            cleanField = 'Phone Number';
          } else if (cleanField.toLowerCase().includes('email')) {
            cleanField = 'Email';
          } else if (cleanField.toLowerCase().includes('address') || cleanField.toLowerCase().includes('location')) {
            cleanField = 'Address';
          } else if (cleanField.toLowerCase().includes('date')) {
            cleanField = 'Date';
          } else if (cleanField.toLowerCase().includes('building') || cleanField.toLowerCase().includes('bldg')) {
            cleanField = 'Building';
          } else if (cleanField.toLowerCase().includes('road') || cleanField.toLowerCase().includes('street')) {
            cleanField = 'Road';
          } else if (cleanField.toLowerCase().includes('block')) {
            cleanField = 'Block';
          } else if (cleanField.toLowerCase().includes('quantity') || cleanField.toLowerCase().includes('qty')) {
            cleanField = 'Quantity';
          } else if (cleanField.toLowerCase().includes('price') && cleanField.toLowerCase().includes('unit')) {
            cleanField = 'Unit Price';
          } else if (cleanField.toLowerCase().includes('description') || cleanField.toLowerCase().includes('item')) {
            cleanField = 'Description';
          } else {
            // For other fields, clean up and capitalize properly
            cleanField = cleanField
              .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
              .replace(/\s+/g, ' ') // Replace multiple spaces with single space
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
          }
          
          // Clean value: remove asterisks and long narrative phrases
          let cleanValue = String(value).replace(/\*/g, '').trim();
          
          // Remove common narrative phrases from values
          cleanValue = cleanValue
            .replace(/^(the\s+)?image\s+(displays?|shows?|contains?)\s*/i, '')
            .replace(/^this\s+(document|quotation|invoice)\s+(contains?|shows?|displays?)\s*/i, '')
            .replace(/^according\s+to\s+the\s+(document|image)\s*,?\s*/i, '')
            .replace(/^based\s+on\s+the\s+(document|image)\s*,?\s*/i, '')
            .replace(/^from\s+the\s+(document|image)\s*,?\s*/i, '')
            .replace(/^document\s+details\s*:?\s*/i, '')
            .replace(/^in\s+summary\s*,?\s*/i, '');
          
          tableRows.push({
            field: cleanField,
            value: cleanValue
          });
        }
      });
    }
    
    return tableRows.length > 0 ? tableRows : [{ field: 'Content', value: content.replace(/\*/g, '').trim() }];
  };

  const renderMessageContent = (message: Message) => {
    if (message.role === "user" || responseFormat === "natural") {
      return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
    }

    if (responseFormat === "json") {
      const jsonData = parseResponseToJSON(message.content);
      return (
        <div className="text-sm space-y-3">
          <div className="flex items-center gap-2 text-orange-600 font-medium">
            <span>📄</span>
            <span>Structured JSON Output</span>
          </div>
          <pre className="bg-muted/50 p-3 rounded border text-xs overflow-x-auto font-mono">
            {JSON.stringify(jsonData, null, 2)}
          </pre>
        </div>
      );
    }

    if (responseFormat === "table") {
      const tableData = parseResponseToTable(message.content);
      return (
        <div className="text-sm space-y-3">
          <div className="flex items-center gap-2 text-orange-600 font-medium">
            <span>📋</span>
            <span>Field Table View</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Field Name</TableHead>
                <TableHead className="text-xs">Extracted Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="text-xs">{row.field}</TableCell>
                  <TableCell className="text-xs">{row.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
  };

  return (
    <div 
      className={`flex flex-col h-screen bg-background transition-colors duration-200 ${
        isDragging ? "bg-primary/5 border-2 border-dashed border-primary" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center gap-4 mb-3">
          <img 
            src="/lovable-uploads/730223c1-ddd5-42a9-be9e-edf669fec1ed.png" 
            alt="GIG Logo" 
            className="h-10 w-auto"
          />
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Welcome Hafeez, Thanks for Logging in</h1>
            <p className="text-sm text-muted-foreground">OCI Intelligent Document Field Extractor</p>
          </div>
          <Badge variant="secondary" className="ml-auto">
            Llama 4 Maverick
          </Badge>
        </div>
        
        {/* Response Format Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Response Format:</span>
          <ToggleGroup 
            type="single" 
            value={responseFormat} 
            onValueChange={(value) => value && setResponseFormat(value as 'natural' | 'json' | 'table')}
            className="bg-muted/50 p-1 rounded-lg"
          >
            <ToggleGroupItem value="natural" size="sm" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              Natural
            </ToggleGroupItem>
            <ToggleGroupItem value="json" size="sm" className="text-xs">
              <Code className="h-3 w-3 mr-1" />
              JSON
            </ToggleGroupItem>
            <ToggleGroupItem value="table" size="sm" className="text-xs">
              <TableIcon className="h-3 w-3 mr-1" />
              Table
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {isDragging && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card border-2 border-dashed border-primary rounded-lg p-8 text-center animate-scale-in">
              <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Drop your document here</h3>
              <p className="text-muted-foreground">Images and PDFs supported (max 10MB)</p>
            </div>
          </div>
        )}
        
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex gap-3 max-w-[80%] ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message Content */}
                <Card
                  className={`${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card"
                  }`}
                >
                  <CardContent className="p-3">
                    {message.image && (
                      <div className="mb-3">
                        <img
                          src={message.image}
                          alt="Uploaded document"
                          className="max-w-xs rounded-lg border"
                        />
                      </div>
                    )}
                     {renderMessageContent(message)}
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="w-4 h-4 text-muted-foreground" />
              </div>
              <Card className="bg-card">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">Processing...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-card p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about the document or upload an image to extract fields..."
                disabled={isLoading}
                className="pr-12"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*,.pdf"
              className="hidden"
            />
            
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="shrink-0"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              <span>Images</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>PDFs</span>
            </div>
            <span>Max 5MB • Drag & Drop Supported</span>
          </div>
        </div>
      </div>
    </div>
  );
}
