import fs from "fs";
import path from "path";

export const STORAGE_DIR = path.join(process.cwd(), "storage");
export const FILE_NAME = "holiday-calendar.pdf";
export const FILE_PATH = path.join(STORAGE_DIR, FILE_NAME);

export function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

export function fileExists() {
  return fs.existsSync(FILE_PATH);
}

export function deleteFileIfExists() {
  if (fs.existsSync(FILE_PATH)) {
    fs.unlinkSync(FILE_PATH);
  }
}
