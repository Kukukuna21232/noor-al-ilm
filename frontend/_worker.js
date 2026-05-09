export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle static assets
    if (url.pathname.startsWith('/_next') || 
        url.pathname.startsWith('/images') || 
        url.pathname.startsWith('/icons') ||
        url.pathname.includes('.')) {
      return env.ASSETS.fetch(request);
    }
    
    // Handle all other routes with index.html for SPA
    return env.ASSETS.fetch(new Request('/index.html', request));
  }
};
