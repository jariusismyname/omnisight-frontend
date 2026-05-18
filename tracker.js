class OmniSight {
    constructor(config) {
      this.projectId = config.projectId;
      this.endpoint = config.endpoint || 'https://omnisight-backend.onrender.com/ingest';
      this.sessionData = [];
      
      this.init();
    }
  

    trackErrors() {
        // Catch standard JS errors
        window.addEventListener('error', (event) => {
          this.queueData({
            type: 'error',
            message: event.message,
            source: event.filename,
            lineno: event.lineno,
            timestamp: Date.now()
          });
        });
    
        // Catch unhandled Promise rejections (e.g., failed fetch requests)
        window.addEventListener('unhandledrejection', (event) => {
          this.queueData({
            type: 'promise_rejection',
            message: event.reason ? event.reason.toString() : 'Unknown Rejection',
            timestamp: Date.now()
          });
        });
      }
    
      queueData(data) {
        this.sessionData.push(data);
        console.log('[OmniSight] Data queued:', data);
      }
    init() {
      console.log(`[OmniSight] Initialized for project: ${this.projectId}`);
      this.trackErrors();
      this.trackPerformance();
      this.setupBeacon();
    }


    trackPerformance() {
        // Check if the browser supports PerformanceObserver
        if ('PerformanceObserver' in window) {
          
          // Track Largest Contentful Paint (LCP) - Measures loading speed
          const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.queueData({
              type: 'performance_lcp',
              value: lastEntry.renderTime || lastEntry.loadTime,
              timestamp: Date.now()
            });
          });
          lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    
        }
      }

      setupBeacon() {
        // Send data when the user leaves the page or closes the tab
        window.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden' && this.sessionData.length > 0) {
            
            const payload = JSON.stringify({
              projectId: this.projectId,
              url: window.location.href,
              events: this.sessionData
            });
    
            // sendBeacon sends a POST request without waiting for a response
            navigator.sendBeacon(this.endpoint, payload);
            
            // Clear the queue
            this.sessionData = []; 
          }
        });
      }
  }
  
  // Attach to the window object so host websites can use it
  window.OmniSight = OmniSight;