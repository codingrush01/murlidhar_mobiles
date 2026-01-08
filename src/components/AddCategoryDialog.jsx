// components/AddCategoryDialog.jsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"

export function AddCategoryDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon"><Plus /></Button>
      </DialogTrigger>
      <DialogContent>
        <Tabs defaultValue="brand">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="brand">Phone Brand</TabsTrigger>
            <TabsTrigger value="type">Cover Type</TabsTrigger>
          </TabsList>
          <TabsContent value="brand">
             {/* Form to add Brand to Firestore */}
          </TabsContent>
          <TabsContent value="type">
             {/* Form to add Cover Type to Firestore */}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}