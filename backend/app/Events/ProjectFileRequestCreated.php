<?php

namespace App\Events;

use App\Models\ProjectFileRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectFileRequestCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public ProjectFileRequest $fileRequest;

    public function __construct(ProjectFileRequest $fileRequest)
    {
        $this->fileRequest = $fileRequest->loadMissing(['requester:id,name,email', 'client:id,name,company_name']);
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel("project.{$this->fileRequest->project_id}"),
        ];

        // Also broadcast to the client's private user channel if user account exists
        $clientUser = $this->fileRequest->client?->user;
        if ($clientUser) {
            $channels[] = new PrivateChannel("user.{$clientUser->id}");
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'ProjectFileRequestCreated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'project_id' => $this->fileRequest->project_id,
            'file_request' => $this->fileRequest,
        ];
    }
}
