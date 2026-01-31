import { redirect } from 'next/navigation'

// Redirect /about-us to /about
export default function AboutUsPage() {
  redirect('/about')
}
