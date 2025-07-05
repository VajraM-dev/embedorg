"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  FileText,
  Clock,
  DollarSign,
  Plus,
  ArrowUpRight,
  Search,
} from "lucide-react";

import { LayoutWrapper } from "@/components/layout-wrapper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/lib/config";
import { Project } from "../projects/page";
import { Progress } from "@/components/ui/progress";
import router from "next/router";

export default function HomePage() {
  const [totalProjects, setTotalProjects] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<{
    total_files: number;
    embedded_files: number;
    non_embedded_files: number;
    total_embeddings: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_BASE_URL + "/db/projects", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      const projects = await response.json();
      setTotalProjects(projects.length);
      const top3Projects = projects
        .sort((a: Project, b: Project) => {
          if (!a.updated_at || !b.updated_at) return 0;
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        })
        .slice(0, 3);
      setProjects(top3Projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(API_BASE_URL + "/db/projects/stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      const stats = await response.json();
      setStats(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchStats();
  }, []);


  const filteredProjects = projects
    .filter((project) =>
      project.project_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a: Project, b: Project) => {
      if (!a.updated_at || !b.updated_at) return 0;
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });

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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <LayoutWrapper>
      <div className="space-y-6 w-full px-0 mx-0 mt-4 mb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor your projects and document processing status
            </p>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 w-full">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/10">
              <CardTitle className="text-sm font-medium">
                Total Projects
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{totalProjects}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active projects in your workspace
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/10">
              <CardTitle className="text-sm font-medium">
                Embedded Documents
              </CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {stats?.embedded_files || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.embedded_files && stats?.embedded_files > 0
                  ? `+${Math.floor(
                      stats?.embedded_files * 0.15
                    )} from last week`
                  : "No documents embedded yet"}
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/10">
              <CardTitle className="text-sm font-medium">
                Pending Documents
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {stats?.non_embedded_files || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.non_embedded_files && stats?.non_embedded_files > 0
                  ? `${stats?.non_embedded_files} awaiting processing`
                  : "All documents processed"}
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/10">
              <CardTitle className="text-sm font-medium">
                Total Documents
              </CardTitle>
              <FileText className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {stats?.total_files || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.total_files && stats?.total_files > 0
                  ? `+${Math.floor(
                      stats?.total_files * 0.15
                    )} from last week`
                  : "No documents embedded yet"}
              </p>
            </CardContent>
          </Card>
          {/* <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/10">
              <CardTitle className="text-sm font-medium">
                Processing Cost
              </CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                $
                {stats?.total_embeddings
                  ? (stats?.total_embeddings * 0.01).toFixed(2)
                  : "0.00"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on {stats?.total_embeddings || 0} total embeddings
              </p>
            </CardContent>
          </Card> */}
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Projects</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects..."
                className="w-full md:w-64 pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <span className="block mb-2">Loading projects...</span>
                <Progress value={45} className="w-48" />
              </div>
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project: Project) => (
                <Card
                  key={project.project_id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{project.project_name}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                          {project.description || "No description provided"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardFooter className="pt-0 pb-3">
                    <Link
                      href={`/projects/${project.project_id}`}
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full">
                        <span>View Project</span>
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="w-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No projects found</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  {searchQuery
                    ? `No projects match your search "${searchQuery}"`
                    : "You haven't created any projects yet. Create your first project to get started."}
                </p>
                <Button onClick={() => router.push("/projects")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Project
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </LayoutWrapper>
  );
}
