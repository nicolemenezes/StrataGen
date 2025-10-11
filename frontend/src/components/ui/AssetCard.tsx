import React from 'react';

const getImageUrl = (path: string) => `${import.meta.env.VITE_SUPABASE_PROJECT_URL}/storage/v1/object/public/assets/${path}`;

export const AssetCard = ({ day }) => {
  const imageTask = day.tasks.find(t => t.type === 'image_generate');
  const captionTask = day.tasks.find(t => t.meta?.copy_type === 'caption');
  const titleTask = day.tasks.find(t => t.meta?.copy_type === 'blog_title');
  const bodyTask = day.tasks.find(t => t.meta?.copy_type === 'blog_body');

  const imageAsset = day.assets.find(a => a.task_id === imageTask?.id && imageTask?.status === 'completed');
  const caption = day.copies.find(c => c.task_id === captionTask?.id && captionTask?.status === 'completed');
  const title = day.copies.find(c => c.task_id === titleTask?.id && titleTask?.status === 'completed');
  const body = day.copies.find(c => c.task_id === bodyTask?.id && bodyTask?.status === 'completed');
  
  // A task is regenerating if it's not completed OR if a newer task is regenerating from it.
  const isTaskRegenerating = (task) => {
    if (!task) return false;
    if (task.status !== 'completed') return true;
    return day.tasks.some(t => t.meta?.regenerated_from_task === task.id && t.status !== 'completed');
  }

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', background: 'white', display: 'flex', gap: '20px', padding: '15px', minHeight: '250px' }}>
      {/* Image Section (only for Instagram) */}
      {day.platform === 'instagram' && (
        <div style={{ flex: 1, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
          {isTaskRegenerating(imageTask) ? (
            <span>🎨 Regenerating Image...</span>
          ) : imageAsset ? (
            <img src={getImageUrl(imageAsset.storage_path)} alt={day.concept} style={{ width: '100%', objectFit: 'cover', borderRadius: '4px' }} />
          ) : (
            <span>⏳ Image Queued...</span>
          )}
        </div>
      )}
      
      {/* Copy Section */}
      <div style={{ flex: 1 }}>
        {caption && (
          isTaskRegenerating(captionTask) ? <p>✍️ Regenerating Caption...</p> : <p>"{caption.content}"</p>
        )}
        {title && (
          isTaskRegenerating(titleTask) ? <h4>✍️ Regenerating Title...</h4> : <h4>{title.content}</h4>
        )}
        {body && (
          isTaskRegenerating(bodyTask) ? <p>✍️ Regenerating Blog...</p> : <p>{body.content.substring(0, 200)}...</p>
        )}
      </div>
    </div>
  );
};