import { Wrench } from "lucide-react";

type MaintenanceProps = {
  message?: string;
};

const Maintenance = ({ message }: MaintenanceProps) => {
  return (
    <div className="hero-gradient flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl rounded-2xl border bg-background/80 p-8 shadow-sm backdrop-blur">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Wrench className="h-7 w-7" />
        </div>

        <div className="text-center">
          <div className="mb-2 text-sm font-medium text-muted-foreground">
            LiveShare
          </div>
          <h1 className="mb-3 text-3xl font-bold tracking-tight">
            Under maintenance
          </h1>
          <p className="text-base text-muted-foreground">
            {message?.trim()
              ? message
              : "We’re doing some improvements right now. Please check back in a bit."}
          </p>

          <div className="mt-8">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Refresh
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;

