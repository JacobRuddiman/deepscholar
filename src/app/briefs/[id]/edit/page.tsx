'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BriefEditor from '@/app/components/brief/BriefEditor'; // Assuming this is the editor component
import { getBriefById } from '@/server/actions/briefs';

export default function EditBriefPage() {
  const params = useParams();
  const briefId = params.id as string;
  const [briefData, setBriefData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const loadBrief = async () => {
      const result = await getBriefById(briefId);
      if (result.success) {
        setBriefData(result.data);
        // Check if current user is the owner
        // This would need to be implemented based on your auth system
        setIsOwner(true); // For now, assume user is owner if they can access edit page
      }
      setLoading(false);
    };
    void loadBrief();
  }, [params.id]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Pass briefData to the editor with version management props */}
      <BriefEditor 
        initialData={briefData} 
        briefId={briefId}
        isOwner={isOwner}
      />
    </div>
  );
}
