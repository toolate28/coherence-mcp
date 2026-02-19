use tokio::sync::broadcast;
use crate::protocol::Message;

pub struct MessageBus {
    sender: broadcast::Sender<Message>,
}

impl MessageBus {
    pub fn new(capacity: usize) -> Self {
        let (sender, _) = broadcast::channel(capacity);
        Self { sender }
    }

    pub fn subscribe(&self) -> broadcast::Receiver<Message> {
        self.sender.subscribe()
    }

    pub fn publish(&self, message: Message) -> anyhow::Result<usize> {
        self.sender.send(message).map_err(|e| anyhow::anyhow!("Publish failed: {}", e))
    }
}