"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  MoreVertical,
  Upload,
  ChevronLeft,
  FileText,
  FileImage,
  FileCode,
  FileIcon,
  RefreshCw,
  Trash2,
  Info,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Copy,
} from "lucide-react";

import { LayoutWrapper } from "@/components/layout-wrapper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL } from "@/lib/config";
import { Project } from "../page";
import { useToast } from "@/hooks/use-toast";

// Types for our API responses
interface ProjectFile {
  project_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  is_embedded: boolean;
  size_bytes: number;
  uploaded_by_cognito_sub: string;
  file_id: string;
  created_at: string;
  updated_at: string;
}

interface ProjectStats {
  total_files: number;
  embedded_files: number;
  non_embedded_files: number;
  total_embeddings: number;
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { toast } = useToast();

  // State for project data
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for UI interactions
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [deleteEmbeddingDialogOpen, setDeleteEmbeddingDialogOpen] = useState(false);
  const [deleteFileDialogOpen, setDeleteFileDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<ProjectFile | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  // Embedding loader state: fileId -> boolean
  const [embeddingLoading, setEmbeddingLoading] = useState<{ [fileId: string]: boolean }>({});
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isEmbedAllDialogOpen, setIsEmbedAllDialogOpen] = useState(false);
  const [publishResponse, setPublishResponse] = useState<{
    curl: string;
    python_requests: string;
    langchain_code: string;
  } | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState('langchain');
  const [checkedFiles, setCheckedFiles] = useState<string[]>([]);

  // Mock project data - in a real app, this would come from an API call
  // This is just for demonstration until we get the real project details

  // Fetch project files and stats
  const fetchProjectData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, these would be actual API calls
      // For now, we're just simulating the API response
      const projectResponse = await fetch(
        `${API_BASE_URL}/db/projects/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      if (!projectResponse.ok)
        throw new Error("Failed to fetch project details");
      const project = await projectResponse.json();
      // Fetch project details (this would be another API endpoint in a real app)
      setProject(project);

      // Fetch files for this project
      const filesResponse = await fetch(
        `${API_BASE_URL}/db/files/projects/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      if (!filesResponse.ok) throw new Error("Failed to fetch project files");
      const filesData = await filesResponse.json();
      setFiles(filesData['files']);

      // Fetch project stats
      const statsResponse = await fetch(
        `${API_BASE_URL}/db/projects/${projectId}/stats`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        } 
      );
      if (!statsResponse.ok) throw new Error("Failed to fetch project stats");
      const statsData = await statsResponse.json();
      setStats(statsData);
    } catch (err) {
      console.error("Error fetching project data:", err);
      setError("Failed to load project data. Please try again later.");

      setStats({
        total_files: 0,
        embedded_files: 0,
        non_embedded_files: 0,
        total_embeddings: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);


  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate file upload with progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 300);

      // Simulate API call
      setTimeout(async () => {
        clearInterval(interval);

        // In a real app, you would make an actual POST request here
        const formData = new FormData();

        formData.append("project_id", projectId);
        selectedFiles.forEach((file) => formData.append("files", file));

        const response = await fetch(`${API_BASE_URL}/db/files/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: formData,
        });

        if (!response.ok) throw new Error("Failed to upload files");

        // Add the files to our list for UI purposes
        const newFiles = selectedFiles.map((file) => ({
          project_id: projectId,
          file_name: file.name,
          storage_path: `/storage/${file.name}`,
          mime_type: file.type,
          is_embedded: false, // New uploads start non-embedded
          size_bytes: file.size,
          uploaded_by_cognito_sub: "current-user",
          file_id: `file-${Date.now()}-${file.name}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        setFiles((prev) => [...newFiles, ...prev]);

        // Update stats
        if (stats) {
          setStats({
            ...stats,
            total_files: stats.total_files + newFiles.length,
            non_embedded_files: stats.non_embedded_files + newFiles.length,
          });
        }

        setIsUploading(false);
        setIsUploadDialogOpen(false);
        setSelectedFiles([]);
        // fetchProjectData();
        setUploadProgress(0);
      }, 3000);
    } catch (err) {
      console.error("Error uploading files:", err);
      setIsUploading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    } else if (mimeType === "application/pdf") {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (
      mimeType === "text/plain" ||
      mimeType === "text/html" ||
      mimeType === "text/css" ||
      mimeType === "application/json" ||
      mimeType === "text/javascript"
    ) {
      return <FileCode className="h-5 w-5 text-green-500" />;
    } else if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimeType === "application/vnd.ms-excel"
    ) {
      return <FileText className="h-5 w-5 text-green-700" />;
    } else {
      return <FileIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Filter files based on active tab and sorting
  const getFilteredFiles = (): ProjectFile[] => {
    let filtered = [...files];
    
    // Filter by active tab
    if (activeTab === 'embedded') {
      filtered = filtered.filter((file: ProjectFile) => file.is_embedded);
    } else if (activeTab === 'non-embedded') {
      filtered = filtered.filter((file: ProjectFile) => !file.is_embedded);
    }
    
    // Sort files
    filtered.sort((a: ProjectFile, b: ProjectFile) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.file_name.localeCompare(b.file_name)
          : b.file_name.localeCompare(a.file_name);
      } else if (sortBy === 'size') {
        return sortOrder === 'asc'
          ? a.size_bytes - b.size_bytes
          : b.size_bytes - a.size_bytes;
      } else {
        // Default sort by date
        return sortOrder === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    
    return filtered;
  };

  const handleGenerateEmbedding = async (fileId: string) => {
    setEmbeddingLoading((prev) => ({ ...prev, [fileId]: true }));
    const generateEmbeddingResponse = await fetch(
      `${API_BASE_URL}/embeddings/create-embeddings`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ file_ids: [fileId] }),
      }
    );

    if (!generateEmbeddingResponse.ok) {
      //show error toast
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate embeddings",
      });
      setEmbeddingLoading((prev) => ({ ...prev, [fileId]: false }));
    return;
  }

    const generateEmbeddingData = await generateEmbeddingResponse.json();
    // if (!generateEmbeddingData.success) {
    //   toast({
    //     variant: "destructive",
    //     title: "Error",
    //     description: generateEmbeddingData.message,
    //   });
    //   return;
    // }
    // Show success message
    toast({
      variant: "default",
      title: "",
      description: generateEmbeddingData.message,
    });

    setFiles(
      files.map((file) =>
        file.file_id === fileId ? { ...file, is_embedded: true } : file
      )
    );
    setEmbeddingLoading((prev) => ({ ...prev, [fileId]: false }));
    // Update stats
    if (stats) {
      setStats({
        ...stats,
        embedded_files: stats.embedded_files + 1,
        non_embedded_files: stats.non_embedded_files - 1
      });
    }
  };

  const handleDeleteEmbedding = async (fileId: string) => {
    try {
      setEmbeddingLoading(prev => ({ ...prev, [fileId]: true }));
      
      const response = await fetch(`${API_BASE_URL}/embeddings/delete-embeddings-ids/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete embeddings');
      
      // Update the file's embedded status
      setFiles(files.map(file => 
        file.file_id === fileId ? { ...file, is_embedded: false } : file
      ));
      
      // Show success message
      toast({
        title: "Success",
        description: "Embeddings deleted successfully",
      });
      
      setCheckedFiles(prev => prev.filter(id => id !== fileId));
      
      // Update stats
      if (stats) {
        setStats({
          ...stats,
          embedded_files: stats.embedded_files - 1,
          non_embedded_files: stats.non_embedded_files + 1,
        });
      }
    } catch (error) {
      console.error('Error deleting embeddings:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete embeddings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setEmbeddingLoading(prev => ({ ...prev, [fileId]: false }));
      setDeleteEmbeddingDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      setEmbeddingLoading(prev => ({ ...prev, [fileId]: true }));
      
      // Find the file to be deleted
      const fileToDelete = files.find((file) => file.file_id === fileId);
      if (!fileToDelete) return;

      // Call API to delete the file
      const deleteResponse = await fetch(`${API_BASE_URL}/db/files/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      
      if (!deleteResponse.ok) throw new Error("Failed to delete file");
      
      // Remove the file from the UI
      setFiles(files.filter((file) => file.file_id !== fileId));
      
      // Update stats
      if (stats) {
        setStats({
          ...stats,
          total_files: stats.total_files - 1,
          embedded_files: fileToDelete.is_embedded
            ? stats.embedded_files - 1
            : stats.embedded_files,
          non_embedded_files: !fileToDelete.is_embedded
            ? stats.non_embedded_files - 1
            : stats.non_embedded_files,
        });
      }
      
      // Show success message
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
      
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEmbeddingLoading(prev => ({ ...prev, [fileId]: false }));
      setDeleteFileDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const handleEmbeddingSelectedFiles = async () => {
    try {
      setEmbeddingLoading(prev => ({ ...prev, selected: true }));
      
      const response = await fetch(`${API_BASE_URL}/embeddings/create-embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_ids: checkedFiles
        }),
      });

      if (!response.ok) throw new Error('Failed to embed selected files');

      const data = await response.json();

      // Update files to show they're now embedded
      setFiles((prevFiles: ProjectFile[]) => 
        prevFiles.map((file: ProjectFile) => ({
          ...file,
          is_embedded: checkedFiles.includes(file.file_id) ? true : file.is_embedded
        }))
      );

      // Update stats
      if (stats) {
        const newlyEmbeddedCount = checkedFiles.filter((fileId: string) => 
          !files.find((f: ProjectFile) => f.file_id === fileId)?.is_embedded
        ).length;
        
        setStats({
          ...stats,
          embedded_files: stats.embedded_files + newlyEmbeddedCount,
          non_embedded_files: Math.max(0, stats.non_embedded_files - newlyEmbeddedCount),
        });
      }

      // Show success message
      toast({
        title: 'Success',
        description: 'Selected files have been embedded successfully.',
        variant: 'default',
      });
      
      // Clear checked files on success
      setCheckedFiles([]);
      
    } catch (error: any) {
      console.error('Error embedding files:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to embed selected files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      // Clear loading state
      setEmbeddingLoading((prev: { [key: string]: boolean }) => ({ ...prev, selected: false }));
    }
  };

  const handleEmbedAllFiles = async () => {
    try {
      // Get all non-embedded files
      const nonEmbeddedFiles = files.filter((file: ProjectFile) => !file.is_embedded);
      
      // Update loading state for all non-embedded files
      const newLoadingState = { ...embeddingLoading };
      nonEmbeddedFiles.forEach((file: ProjectFile) => {
        newLoadingState[file.file_id] = true;
      });
      setEmbeddingLoading(newLoadingState);
      
      // Call API to embed all files
      const response = await fetch(`${API_BASE_URL}/embeddings/create-embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_ids: nonEmbeddedFiles.map((file: ProjectFile) => file.file_id)
        }),
      });

      if (!response.ok) throw new Error('Failed to embed all files');

      // Update files to show they're now embedded
      setFiles((prevFiles: ProjectFile[]) => 
        prevFiles.map(file => ({
          ...file,
          is_embedded: true
        }))
      );

      // Update stats
      if (stats) {
        setStats({
          ...stats,
          embedded_files: stats.total_files,
          non_embedded_files: 0,
        });
      }

      // Show success message
      toast({
        title: 'Success',
        description: 'All files have been embedded successfully.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error embedding all files:', error);
      toast({
        title: 'Error',
        description: 'Failed to embed all files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      // Clear loading states
      setEmbeddingLoading({});
    }
  };

  const handleCheckboxChange = (fileId: string) => {
    const newCheckedFiles = checkedFiles.includes(fileId)
      ? checkedFiles.filter(id => id !== fileId)
      : [...checkedFiles, fileId];
    setCheckedFiles(newCheckedFiles);
  };

  const confirmDeleteEmbedding = (file: ProjectFile) => {
    setFileToDelete(file);
    setDeleteEmbeddingDialogOpen(true);
  };

  const confirmDeleteFile = (file: ProjectFile) => {
    setFileToDelete(file);
    setDeleteFileDialogOpen(true);
  };

  const DeleteEmbeddingConfirmationDialog = () => (
    <Dialog open={deleteEmbeddingDialogOpen} onOpenChange={setDeleteEmbeddingDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Embeddings</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the embeddings for <span className="font-semibold">{fileToDelete?.file_name}</span>? 
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setDeleteEmbeddingDialogOpen(false);
              setFileToDelete(null);
            }}
            disabled={embeddingLoading[fileToDelete?.file_id || '']}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => fileToDelete && handleDeleteEmbedding(fileToDelete.file_id)}
            disabled={embeddingLoading[fileToDelete?.file_id || '']}
          >
            {embeddingLoading[fileToDelete?.file_id || ''] ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Embeddings'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const DeleteFileConfirmationDialog = () => (
    <Dialog open={deleteFileDialogOpen} onOpenChange={setDeleteFileDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete File</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the file <span className="font-semibold">{fileToDelete?.file_name}</span>? 
            This will permanently remove the file and its embeddings. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setDeleteFileDialogOpen(false);
              setFileToDelete(null);
            }}
            disabled={embeddingLoading[fileToDelete?.file_id || '']}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => fileToDelete && handleDeleteFile(fileToDelete.file_id)}
            disabled={embeddingLoading[fileToDelete?.file_id || '']}
          >
            {embeddingLoading[fileToDelete?.file_id || ''] ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete File Permanently'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    return (
      <LayoutWrapper>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-24 w-full" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </LayoutWrapper>
    );
  }

  if (error && !project) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold">Project not found</h2>
          <p className="text-muted-foreground mb-4">
            The project you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/projects")}>
            Back to Projects
          </Button>
        </div>
      </LayoutWrapper>
    );
  }



  const filteredFiles = getFilteredFiles();

  return (
    <LayoutWrapper>
      {fileToDelete && (
        <>
          <DeleteEmbeddingConfirmationDialog />
          <DeleteFileConfirmationDialog />
        </>
      )}
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/home">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/projects">Projects</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project?.project_name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Project Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Button
              variant="outline"
              size="sm"
              className="mb-2"
              onClick={() => router.push("/projects")}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Projects
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              {project?.project_name}
            </h1>
            <p className="text-muted-foreground mt-2">{project?.description}</p>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    disabled={!stats || stats.embedded_files === 0}
                    onClick={stats && stats.embedded_files > 0 ? async () => {
                      try {
                        const response = await fetch(`http://localhost:7410/publish/usage/${projectId}/code`, {
                          method: 'GET',
                          headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                            'Content-Type': 'application/json',
                          },
                        });

                        if (!response.ok) {
                          throw new Error('Failed to publish project');
                        }

                        const data = await response.json();
                        setPublishResponse(data);
                        setIsPublishDialogOpen(true);
                      } catch (error) {
                        console.error('Error publishing project:', error);
                        toast({
                          variant: 'destructive',
                          title: 'Error',
                          description: 'Failed to publish project. Please try again.',
                        });
                      }
                    } : undefined}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" x2="12" y1="3" y2="15"/>
                    </svg>
                    Publish
                  </Button>
                </TooltipTrigger>
                {(!stats || stats.embedded_files === 0) && (
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span>Embed files before publishing</span>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            {/* Publish Response Dialog */}
            <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
              <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Integration Code</DialogTitle>
                  <DialogDescription>
                    Use the following code to integrate with your application
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <Tabs value={activeCodeTab} onValueChange={setActiveCodeTab}>
                      <TabsList>
                        <TabsTrigger value="langchain">LangChain</TabsTrigger>
                        <TabsTrigger value="python">Python</TabsTrigger>
                        <TabsTrigger value="curl">cURL</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const code = activeCodeTab === 'langchain' 
                          ? publishResponse?.langchain_code 
                          : activeCodeTab === 'python' 
                            ? publishResponse?.python_requests 
                            : publishResponse?.curl;
                        if (code) {
                          navigator.clipboard.writeText(code);
                          toast({
                            title: 'Code copied to clipboard',
                            description: `The ${activeCodeTab} code has been copied to your clipboard.`,
                          });
                        }
                      }}
                      className="flex items-center gap-2"
                      disabled={!publishResponse}
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden rounded-md border bg-gray-50 dark:bg-gray-900 p-4">
                    <div className="h-full overflow-auto">
                      {activeCodeTab === 'langchain' && (
                        <pre className="text-sm">
                          <code className="language-python">
                            {publishResponse?.langchain_code || 'Loading...'}
                          </code>
                        </pre>
                      )}
                      {activeCodeTab === 'python' && (
                        <pre className="text-sm">
                          <code className="language-python">
                            {publishResponse?.python_requests || 'Loading...'}
                          </code>
                        </pre>
                      )}
                      {activeCodeTab === 'curl' && (
                        <pre className="text-sm">
                          <code className="language-bash">
                            {publishResponse?.curl || 'Loading...'}
                          </code>
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button 
                    onClick={() => setIsPublishDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog
              open={isUploadDialogOpen}
              onOpenChange={setIsUploadDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Files</DialogTitle>
                  <DialogDescription>
                    Upload files to embed in your project.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="file-upload">Select Files</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      multiple
                    />
                  </div>
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsUploadDialogOpen(false)}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={selectedFiles.length === 0 || isUploading}
                  >
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Team
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Info className="mr-2 h-4 w-4" />
                  Project Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
  <Alert variant="destructive" className="mb-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>No Files Available</AlertTitle>
    <AlertDescription>
      We couldn't find any files associated with this project. Please make sure files have been uploaded or try refreshing the page.
    </AlertDescription>
  </Alert>
)}


        {/* Project Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.total_files || 0}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                {/* <Calendar className="mr-1 h-3 w-3" /> */}
                {/* Last updated {formatDate(new Date().toISOString())} */}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Embedded Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.embedded_files || 0}
              </div>
              <Progress
                value={
                  stats
                    ? (stats.embedded_files / (stats.total_files || 1)) * 100
                    : 0
                }
                className="h-2 mt-2"
                indicatorClassName="bg-green-500"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Non-Embedded Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.non_embedded_files || 0}
              </div>
              <Progress
                value={
                  stats
                    ? (stats.non_embedded_files / (stats.total_files || 1)) *
                      100
                    : 0
                }
                className="h-2 mt-2"
                indicatorClassName="bg-yellow-500"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Storage Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {files.reduce((total, file) => total + file.size_bytes, 0) > 1024 * 1024 * 1024
                  ? `${(files.reduce((total, file) => total + file.size_bytes, 0) / (1024 * 1024 * 1024)).toFixed(2)} GB`
                  : files.reduce((total, file) => total + file.size_bytes, 0) > 1024 * 1024
                  ? `${(files.reduce((total, file) => total + file.size_bytes, 0) / (1024 * 1024)).toFixed(2)} MB`
                  : files.reduce((total, file) => total + file.size_bytes, 0) > 1024
                  ? `${(files.reduce((total, file) => total + file.size_bytes, 0) / 1024).toFixed(2)} KB`
                  : `${files.reduce((total, file) => total + file.size_bytes, 0)} B`}
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-2">
                <Info className="mr-1 h-3 w-3" />
                {files.length} files stored
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Files Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Files</CardTitle>
              <div className="flex gap-2">
                {checkedFiles.length > 0 && <Button onClick={handleEmbeddingSelectedFiles} >Embed Selected</Button>}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Sort by
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSortBy("date");
                        setSortOrder("desc");
                      }}
                    >
                      Date (newest first)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSortBy("date");
                        setSortOrder("asc");
                      }}
                    >
                      Date (oldest first)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSortBy("name");
                        setSortOrder("asc");
                      }}
                    >
                      Name (A-Z)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSortBy("name");
                        setSortOrder("desc");
                      }}
                    >
                      Name (Z-A)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSortBy("size");
                        setSortOrder("desc");
                      }}
                    >
                      Size (largest first)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSortBy("size");
                        setSortOrder("asc");
                      }}
                    >
                      Size (smallest first)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Bulk Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bulk Upload</DialogTitle>
                      <DialogDescription>Upload multiple files at once to your project.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="bulk-file-upload">Select Files</Label>
                        <Input id="bulk-file-upload" type="file" multiple />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button onClick={handleUpload}>Upload Files</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog> */}
              </div>
            </div>
            <CardDescription>
              Manage and embed your project files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="all"
              className="mb-4"
              onValueChange={setActiveTab}
            >
              <TabsList>
                <TabsTrigger value="all">
                  All Files ({files.length})
                </TabsTrigger>
                <TabsTrigger value="embedded">
                  Embedded ({files.filter((f) => f.is_embedded).length})
                </TabsTrigger>
                <TabsTrigger value="non-embedded">
                  Non-Embedded ({files.filter((f) => !f.is_embedded).length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {filteredFiles.length > 0 ? (
              <div className="rounded-md border">
                <div className="grid grid-cols-12 border-b px-4 py-3 font-medium text-sm">
                  <div className="col-span-1"></div>
                  <div className="col-span-3">File Name</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Size</div>
                  <div className="col-span-2">Uploaded</div>
                  <div className="col-span-2">Actions</div>
                </div>
                {filteredFiles.map((file) => (
                  <div
                    key={file.file_id}
                    className="grid grid-cols-12 items-center px-4 py-3 border-b last:border-0"
                  >
                    <div className="col-span-1">
                    <Checkbox disabled={file.is_embedded} checked={checkedFiles.includes(file.file_id)} onCheckedChange={() => handleCheckboxChange(file.file_id)} />
                    </div>
                    <div className="flex items-center gap-2 font-medium col-span-3">
                      {getFileIcon(file.mime_type)}
                      <span className="truncate">{file.file_name}</span>
                    </div>
                    <div className="col-span-2">
                      {file.is_embedded ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Embedded
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="mr-1 h-3 w-3" />
                          Not Embedded
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm col-span-2">
                      {formatBytes(file.size_bytes)}
                    </div>
                    <div className="text-sm text-muted-foreground col-span-2">
                      {formatDate(file.created_at)}
                    </div>
                    <div className="flex gap-1 col-span-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem> */}
                          {/* <DropdownMenuItem>View Details</DropdownMenuItem> */}
                          {!file.is_embedded && (
                            embeddingLoading[file.file_id] ? (
                              <DropdownMenuItem disabled>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleGenerateEmbedding(file.file_id)
                                }
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Generate Embedding
                              </DropdownMenuItem>
                            )
                          )}
                          {file.is_embedded && (
                            <DropdownMenuItem>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Regenerate Embedding
                            </DropdownMenuItem>
                          )}
                          {file.is_embedded && (
                            <DropdownMenuItem 
                              className="text-yellow-500" 
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDeleteEmbedding(file);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Embedding
                            </DropdownMenuItem>
                          )}
                          {!file.is_embedded && (
                            <DropdownMenuItem
                              className="text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDeleteFile(file);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete File
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No files found</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  {activeTab === "all"
                    ? "Upload files to this project to start embedding them for your application."
                    : activeTab === "embedded"
                    ? "No embedded files found. Generate embeddings for your files to see them here."
                    : "No non-embedded files found. All your files have been embedded!"}
                </p>
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
              </div>
            )}
          </CardContent>
          {filteredFiles.length > 0 && (
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredFiles.length} of {files.length} files
              </div>
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsUploadDialogOpen(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload More Files
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Embedding Progress Section */}
        {stats && stats.non_embedded_files > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Embedding Progress</CardTitle>
              <CardDescription>
                {stats.non_embedded_files} files are waiting to be embedded
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Embedding Progress</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.embedded_files} out of {stats.total_files} files
                      embedded
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {Math.round(
                      (stats.embedded_files / stats.total_files) * 100
                    )}
                    %
                  </div>
                </div>
                <Progress
                  value={(stats.embedded_files / stats.total_files) * 100}
                  className="h-2"
                />
                <div className="flex justify-end">
                  <Dialog open={isEmbedAllDialogOpen} onOpenChange={setIsEmbedAllDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setIsEmbedAllDialogOpen(true)} variant="secondary" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Embed All Files
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Embed All Files</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to embed all files in this project? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEmbedAllDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleEmbedAllFiles}
                          disabled={Object.values(embeddingLoading).some(loading => loading)}
                        >
                          {Object.values(embeddingLoading).some(loading => loading) ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Embedding...
                            </>
                          ) : (
                            'Confirm Embed All'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project Usage Stats */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Project Usage</CardTitle>
            <CardDescription>Usage statistics for this project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium mb-2">Storage Used</p>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-muted-foreground">
                    {formatBytes(
                      files.reduce((acc, file) => acc + file.size_bytes, 0)
                    )}
                  </p>
                  <p className="text-sm font-medium">
                    {Math.min(
                      Math.round(
                        (files.reduce((acc, file) => acc + file.size_bytes, 0) /
                          (100 * 1024 * 1024)) *
                          100
                      ),
                      100
                    )}
                    %
                  </p>
                </div>
                <Progress
                  value={Math.min(
                    (files.reduce((acc, file) => acc + file.size_bytes, 0) /
                      (100 * 1024 * 1024)) *
                      100,
                    100
                  )}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Out of 100MB project limit
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Embedding Credits</p>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-muted-foreground">
                    {stats?.total_embeddings || 0} embeddings used
                  </p>
                  <p className="text-sm font-medium">
                    {Math.min(
                      Math.round(((stats?.total_embeddings || 0) / 1000) * 100),
                      100
                    )}
                    %
                  </p>
                </div>
                <Progress
                  value={Math.min(
                    ((stats?.total_embeddings || 0) / 1000) * 100,
                    100
                  )}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Out of 1,000 monthly embeddings
                </p>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* File Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Recent file activities in this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.slice(0, 5).map((file, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="rounded-full bg-muted p-2">
                    {file.is_embedded ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {file.is_embedded ? "File embedded" : "File uploaded"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {file.file_name} - {formatDate(file.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              {files.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No recent activity
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutWrapper>
  );
}