import { messagesRouter } from '@/modules/messages/server/procedures';
import { createTRPCRouter } from '../init';
import { projectsRouter } from '@/modules/projects/server/procedures';
import { usageRouter } from '@/modules/usage/server/procedures';
import { fragmentsRouter } from '@/modules/fragments/server/procedures';

export const appRouter = createTRPCRouter({
  messages: messagesRouter,
  projects: projectsRouter,
  usage: usageRouter,
  fragments: fragmentsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;