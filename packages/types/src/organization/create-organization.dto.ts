export type CreateOrganizationDto = {
  name: string;

  workingHours: {
    start: string;
    end: string;
  };

  weekOff: (
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY"
  )[];
};
