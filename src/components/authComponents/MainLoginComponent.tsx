import React from "react";

import { LoginFormComponent } from "./LoginFormComponent";
import { HeroSectionComponent } from "./HeroSectionComponent";

export default function MainLoginComponent() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <HeroSectionComponent />

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <LoginFormComponent />
        </div>
      </div>
    </div>
  );
}
