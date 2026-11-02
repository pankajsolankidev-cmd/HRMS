export type CreateHolidayDto = {
  title: string;
  fromDate: string;
  toDate: string;
  description?: string;
};

export type UpdateHolidayDto = {
  title?: string;
  fromDate?: string;
  toDate?: string;
  description?: string;
};

export interface HolidayEntity {
  id: string;
  title: string;
  fromDate: string;
  toDate: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
