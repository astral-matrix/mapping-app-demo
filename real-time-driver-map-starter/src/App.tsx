import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, Container, Typography, Box } from "@mui/material";
import RealTimeDriverMap from "./RealTimeDriverMap";

const qc = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Typography variant="h5" gutterBottom>
          Real-Time Driver Map (Rehearsal)
        </Typography>
        <Box>
          <RealTimeDriverMap
            driverId="D-42"
            wsUrl="ws://localhost:5173/ws"
            snapshotUrl="/api/drivers/D-42"
            breadcrumbSize={30}
            followModeDefault
          />
        </Box>
      </Container>
    </QueryClientProvider>
  );
}
