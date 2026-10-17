import { api, API } from "./api";

export const photoUrl = (path) => (path ? `${API}/files/${path}` : "");

const resize = (file, max = 1600) => new Promise((resolve) => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * s);
    c.height = Math.round(img.height * s);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    c.toBlob((b) => resolve(b || file), "image/jpeg", 0.85);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    resolve(file);
  };
  img.src = url;
});

export const uploadPhoto = async (file) => {
  const blob = await resize(file);
  const fd = new FormData();
  fd.append("file", blob, blob.type === "image/jpeg" ? "photo.jpg" : file.name);
  const { data } = await api.post("/uploads", fd);
  return data.path;
};
