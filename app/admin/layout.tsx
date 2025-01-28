import Layout from '@/components/common/Layout'
import React from 'react'

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Layout>
      {children}
    </Layout>
  )
}

export default layout