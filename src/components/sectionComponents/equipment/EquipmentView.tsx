import { Button } from "@/components/ui/button";
import { Plus, Package, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EquipmentStats } from "./EquipmentStats";
import { EquipmentTable } from "./EquipmentTable";
import { AddEquipmentModal } from "./AddEquipmentModal";
import type { Equipment } from "@/types/equipment";

interface EquipmentViewProps {
  equipment: Equipment[];
  isLoading: boolean;
  isModalOpen: boolean;
  onOpenModal: (open: boolean) => void;
  onEquipmentCreated: () => void;
}

export function EquipmentView({
  equipment,
  isLoading,
  isModalOpen,
  onOpenModal,
  onEquipmentCreated,
}: EquipmentViewProps) {
  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
            Equipment
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your construction equipment and tools
          </p>
        </div>
        {equipment.length > 0 && (
          <Button
            onClick={() => onOpenModal(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Equipment
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : equipment.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No equipment yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start by adding your first equipment
            </p>
            <Button onClick={() => onOpenModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Equipment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <EquipmentStats equipment={equipment} />
          <EquipmentTable equipment={equipment} />
        </>
      )}

      <AddEquipmentModal
        open={isModalOpen}
        onOpenChange={onOpenModal}
        onEquipmentCreated={onEquipmentCreated}
      />
    </section>
  );
}
