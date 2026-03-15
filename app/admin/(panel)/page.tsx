import { redirect } from "next/navigation";

/**
 * /admin — redirects to /admin/stores (the main panel landing page).
 */
export default function AdminIndexPage() {
  redirect("/admin/stores");
}
