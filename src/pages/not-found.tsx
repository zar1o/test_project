import { Link } from "react-router"
import { Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/app/state-views"

export function NotFound() {
  return (
    <div className="glass mx-auto mt-16 max-w-xl rounded-[28px]">
      <EmptyState
        icon={Compass}
        title="Nie ma takiej strony"
        description="Adres mógł się zmienić. Wróć do obszarów księgowych i wybierz sekcję."
        action={
          <Button variant="primary" asChild>
            <Link to="/">Obszary księgowe</Link>
          </Button>
        }
      />
    </div>
  )
}
