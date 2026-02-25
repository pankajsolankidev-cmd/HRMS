export type CreateHolidayDto = {
  title: string;
  fromDate: string;
  toDate: string;
};

export type UpdateHolidayDto = {
  title?: string;
  fromDate?: string;
  toDate?: string;
};
