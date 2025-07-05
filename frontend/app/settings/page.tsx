"use client"

import { LayoutWrapper } from "@/components/layout-wrapper"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/store/userContext"

export default function SettingsPage() {

  // Use the centralized user context
  const { user } = useUser();

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mt-4">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and preferences.</p>
        </div>

        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="embedding">Embedding</TabsTrigger>
            {/* <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger> */}
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your personal information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" defaultValue={user?.name} />
                  </div>
                  {/* <div className="space-y-2">
                    <Label htmlFor="last-name">Last name</Label>
                    <Input id="last-name" defaultValue={user.} />
                  </div> */}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user?.email} />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>

            {/* <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Update your password.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Change Password</Button>
              </CardFooter>
            </Card> */}
          </TabsContent>

          <TabsContent value="embedding" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Embedding Settings</CardTitle>
                <CardDescription>Configure your embedding preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="embedding-model">Embedding Model</Label>
                  <Input id="embedding-model" defaultValue="text-embedding-ada-002" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chunk-size">Chunk Size</Label>
                  <Input id="chunk-size" type="number" defaultValue="1000" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-embed">Auto Embedding</Label>
                    <p className="text-sm text-muted-foreground">Automatically embed documents when uploaded</p>
                  </div>
                  <Switch id="auto-embed" defaultChecked />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* <TabsContent value="notifications" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure how you receive notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="embedding-complete">Embedding Complete</Label>
                    <p className="text-sm text-muted-foreground">Get notified when document embedding is complete</p>
                  </div>
                  <Switch id="embedding-complete" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="team-updates">Team Updates</Label>
                    <p className="text-sm text-muted-foreground">Get notified about team changes</p>
                  </div>
                  <Switch id="team-updates" defaultChecked />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Preferences</Button>
              </CardFooter>
            </Card>
          </TabsContent> */}

          {/* <TabsContent value="billing" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>Manage your billing details and subscription.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Current Plan</div>
                  <div className="rounded-md bg-secondary p-2">
                    <div className="font-medium">Pro Plan</div>
                    <div className="text-sm text-muted-foreground">$49/month</div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-medium">Payment Method</div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-secondary p-2 px-3">
                      <div className="font-medium">•••• •••• •••• 4242</div>
                      <div className="text-sm text-muted-foreground">Expires 12/2025</div>
                    </div>
                    <Button variant="outline" size="sm">
                      Change
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">View Billing History</Button>
                <Button>Update Plan</Button>
              </CardFooter>
            </Card>
          </TabsContent> */}
        </Tabs>
      </div>
    </LayoutWrapper>
  )
}
