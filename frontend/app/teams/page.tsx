"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, MoreVertical, Trash2, Edit } from "lucide-react";

import { LayoutWrapper } from "@/components/layout-wrapper";
import { Button } from "@/components/ui/button";
import { useUser } from "@/store/userContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { API_BASE_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";

export interface Team {
  team_id: string;
  team_name: string;
  description: string;
  members: [];
}

export interface Member {
  id: number;
  member_name: string;
  avatar: string;
  initials: string;
}

export default function TeamsPage() {
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const [newTeam, setNewTeam] = useState({
    team_name: "",
    description: "",
  });
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useUser();
  const router = useRouter();

  // Navigation handler with better error handling
  const handleTeamClick = (teamId: string) => {
    try {
      console.log('Navigating to team:', teamId);
      router.push(`/projects?team=${teamId}`);
    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        variant: "destructive",
        title: "Navigation Error",
        description: "Failed to navigate to team projects",
      });
    }
  };

  const handleAddTeam = async () => {
    try {
      console.log("Creating team:", newTeam);
      const response = await fetch(API_BASE_URL + "/db/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(newTeam),
      });
      
      if(response.ok){
        toast({
          title: "Success",
          description: "Team created successfully",
        });
        fetchTeams();
        setIsAddTeamOpen(false);
        setNewTeam({ team_name: "", description: "" });
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          variant: "destructive",
          title: "Error",
          description: errorData.message || "Team creation failed",
        });
      }
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error while creating team",
      });
    }
  };

  const handleEditTeam = async () => {
    if (!editingTeam) return;
    
    try {
      const response = await fetch(API_BASE_URL + "/db/teams/" + editingTeam.team_id, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          team_name: editingTeam.team_name,
          description: editingTeam.description
        }),
      });
      
      if(response.ok){
        toast({
          title: "Success",
          description: "Team updated successfully",
        });
        fetchTeams();
        setIsEditTeamOpen(false);
        setEditingTeam(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          variant: "destructive",
          title: "Error",
          description: errorData.message || "Team update failed",
        });
      }
    } catch (error) {
      console.error('Error updating team:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error while updating team",
      });
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch(API_BASE_URL + "/db/teams", {method: "GET", headers: {Authorization: `Bearer ${localStorage.getItem("access_token")}`}});
      const data = await response.json();
      
      // Assign default members to each team
      data.forEach((team: Team) => {
        team.members = [];
      });
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load teams",
      });
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      const response = await fetch(API_BASE_URL + "/db/teams/" + teamId, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      
      if(response.ok){
        toast({
          title: "Success",
          description: "Team deleted successfully",
        });
        fetchTeams();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          variant: "destructive",
          title: "Error",
          description: errorData.message || "Team deletion failed",
        });
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error while deleting team",
      });
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
          {isAdmin && (
            <Dialog open={isAddTeamOpen} onOpenChange={setIsAddTeamOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                  <DialogDescription>
                    Add a new team to collaborate on projects.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="team-name">Team Name</Label>
                    <Input
                      id="team-name"
                      value={newTeam.team_name}
                      onChange={(e) =>
                        setNewTeam({ ...newTeam, team_name: e.target.value })
                      }
                      placeholder="Enter team name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="team-description">Description</Label>
                    <Textarea
                      id="team-description"
                      value={newTeam.description}
                      onChange={(e) =>
                        setNewTeam({ ...newTeam, description: e.target.value })
                      }
                      placeholder="Enter team description"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddTeamOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddTeam}>Create Team</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team: Team) => (
            <Card 
              key={team.team_id}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              {/* Fixed: Separate the clickable area from the dropdown */}
              <div 
                className="h-full w-full"
                onClick={() => handleTeamClick(team.team_id)}
              >
                <CardHeader className="relative">
                  {/* Fixed: Position dropdown absolutely to prevent interference */}
                  <div className="absolute top-4 right-4 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTeam(team);
                            setIsEditTeamOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Team
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTeam(team.team_id);
                          }} 
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Fixed: Add padding-right to prevent text overlap with dropdown */}
                  <div className="pr-12">
                    <CardTitle>{team.team_name}</CardTitle>
                    <CardDescription className="mt-2">{team.description}</CardDescription>
                  </div>
                </CardHeader>
              </div>
            </Card>
          ))}
        </div>

        {/* Edit Team Dialog */}
        <Dialog open={isEditTeamOpen} onOpenChange={setIsEditTeamOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
              <DialogDescription>
                Update details for your team.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-team-name">Team Name</Label>
                <Input
                  id="edit-team-name"
                  value={editingTeam?.team_name || ''}
                  onChange={(e) =>
                    setEditingTeam(prev => prev ? { ...prev, team_name: e.target.value } : null)
                  }
                  placeholder="Enter team name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-team-description">Description</Label>
                <Textarea
                  id="edit-team-description"
                  value={editingTeam?.description || ''}
                  onChange={(e) =>
                    setEditingTeam(prev => prev ? { ...prev, description: e.target.value } : null)
                  }
                  placeholder="Enter team description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditTeamOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEditTeam}>Update Team</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutWrapper>
  );
}