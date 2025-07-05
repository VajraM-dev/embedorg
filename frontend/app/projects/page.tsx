"use client"

import { useEffect, useState, Suspense } from "react" // Import Suspense
import { useRouter, useSearchParams } from "next/navigation"
import { MoreVertical, Plus, FileText, Users, Calendar } from "lucide-react"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { fetchWithAuth } from "@/lib/authUtils"
import { useUser } from "@/store/userContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface Project {
  project_id: number;
  project_name: string;
  description: string;
  vector_index_name: string;
  team_id: string;
  updated_at?: string;
  created_at?: string;
}

export interface Team {
  team_id: string;
  team_name: string;
}

// Create a separate component for the logic that uses useSearchParams
function ProjectsContent() {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false)
  const [currentEditProject, setCurrentEditProject] = useState<Project | null>(null)
  const [newProject, setNewProject] = useState({
    project_name: "",
    description: "",
    vector_index_name: "",
    team_id: "",
    updated_at: "",
    created_at: "",
  })

  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all')
  // useSearchParams is used here
  const searchParams = useSearchParams() 
  const { toast } = useToast()

  // Use the user context
  const { user } = useUser();

  const handleAddProject = async () => {
    try {
      await fetchWithAuth('/db/projects', {
        method: "POST",
        body: JSON.stringify(newProject),
      });

      toast({
        title: "Success",
        description: "Project created successfully",
      });
      setIsNewProjectOpen(false);
      setNewProject({
        project_name: "",
        description: "",
        vector_index_name: "",
        team_id: "",
        updated_at: "",
        created_at: "",
      });
      fetchProjects();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create project"
      });
    }
  }

  const handleUpdateProject = async () => {
    if (!currentEditProject) return;

    try {
      await fetchWithAuth(`/db/projects/${currentEditProject.project_id}`, {
        method: "PUT",
        body: JSON.stringify(currentEditProject),
      });

      toast({
        title: "Success",
        description: "Project updated successfully",
      });
      setIsEditProjectOpen(false);
      setCurrentEditProject(null);
      fetchProjects();
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update project"
      });
    }
  }

  const handleDeleteProject = async (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await fetchWithAuth(`/db/projects/projects/${projectId}`, {
        method: "DELETE",
      });

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete project",
      });
    }
  }

  const navigateToProject = (projectId: number) => {
    router.push(`/projects/${projectId}`);
  }

  const fetchProjects = async () => {
    try {
      const data = await fetchWithAuth<Project[]>('/db/projects');
      setAllProjects(data);
      setFilteredProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load projects"
      });
    }
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

  const fetchTeams = async () => {
    try {
      const data = await fetchWithAuth<Team[]>('/db/teams');
      setTeams(data);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load teams"
      });
    }
  };

  // Filter projects when team selection or projects change
  useEffect(() => {
    if (selectedTeamId === 'all') {
      setFilteredProjects(allProjects);
    } else {
      if (allProjects.length > 0) {
        const filtered = allProjects.filter(project => project.team_id === selectedTeamId);
        setFilteredProjects(filtered);
      }
    }
  }, [selectedTeamId, allProjects]);

  // Set initial team filter from URL
  useEffect(() => {
    const teamId = searchParams.get('team');
    if (teamId) {
      if (teamId !== selectedTeamId) {
        setSelectedTeamId(teamId);
      }
    } else if (selectedTeamId !== 'all') {
      setSelectedTeamId('all');
    }
  }, [searchParams, selectedTeamId]);

  useEffect(() => {
    fetchProjects();
    fetchTeams();
  }, []);

  return (
    <LayoutWrapper>
      <div className="space-y-6 mt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Add a new project to your workspace.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    value={newProject.project_name}
                    onChange={(e) => setNewProject({ ...newProject, project_name: e.target.value })}
                    placeholder="Enter project name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Enter project description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vector-index-name">Vector Index Name</Label>
                  <Input
                    id="vector-index-name"
                    value={newProject.vector_index_name}
                    onChange={(e) => setNewProject({ ...newProject, vector_index_name: e.target.value })}
                    placeholder="Enter vector index name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="team-id">Team</Label>
                  <Select
                    value={newProject.team_id}
                    onValueChange={(value) => setNewProject({ ...newProject, team_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.team_id} value={team.team_id}>
                          {team.team_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewProjectOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddProject}>Create Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Project Dialog */}
        <Dialog open={isEditProjectOpen} onOpenChange={(open) => {
          setIsEditProjectOpen(open);
          if (!open) setCurrentEditProject(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>Update project details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-project-name">Project Name</Label>
                <Input
                  id="edit-project-name"
                  value={currentEditProject?.project_name || ''}
                  onChange={e => setCurrentEditProject(prev => prev ? { ...prev, project_name: e.target.value } : null)}
                  placeholder="Enter project name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-project-description">Description</Label>
                <Textarea
                  id="edit-project-description"
                  value={currentEditProject?.description || ''}
                  onChange={e => setCurrentEditProject(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Enter project description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-vector-index-name">Vector Index Name</Label>
                <Input
                  id="edit-vector-index-name"
                  value={currentEditProject?.vector_index_name || ''}
                  onChange={e => setCurrentEditProject(prev => prev ? { ...prev, vector_index_name: e.target.value } : null)}
                  placeholder="Enter vector index name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-team-id">Team</Label>
                <Select
                  value={currentEditProject?.team_id || ''}
                  onValueChange={value => setCurrentEditProject(prev => prev ? { ...prev, team_id: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.team_id} value={team.team_id}>
                        {team.team_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsEditProjectOpen(false);
                setCurrentEditProject(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProject} disabled={!currentEditProject}>
                Update Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex justify-end mb-4">
          <Select 
            value={selectedTeamId}
            onValueChange={(value) => {
              setSelectedTeamId(value);
              const newUrl = value === 'all' 
                ? '/projects' 
                : `/projects?team=${value}`;
              router.push(newUrl, { scroll: false });
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.team_id} value={team.team_id}>
                  {team.team_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card
              key={project.project_id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigateToProject(project.project_id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{project.project_name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          navigateToProject(project.project_id)
                        }}
                      >
                        View Files
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentEditProject({...project});
                          setIsEditProjectOpen(true);
                        }}
                      >
                        Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive" 
                        onClick={(e) => handleDeleteProject(project.project_id, e)}
                      >
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>
              <CardContent>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Updated {formatDate(project.updated_at ?? "")}</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </LayoutWrapper>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div>Loading projects...</div>}>
      <ProjectsContent />
    </Suspense>
  )
}