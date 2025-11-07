import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

const Equipe = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <Construction className="h-32 w-32 text-muted-foreground mb-8 animate-pulse" />
                <h1 className="text-5xl font-bold mb-4">EM DESENVOLVIMENTO</h1>
                <p className="text-muted-foreground text-xl max-w-md">
                  Esta funcionalidade está sendo construída e estará disponível em breve.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Equipe;
