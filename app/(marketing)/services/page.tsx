import { redirect } from 'next/navigation'

// Redirect /services to /pricing where all services are displayed
export default function ServicesPage() {
  redirect('/pricing')
}
