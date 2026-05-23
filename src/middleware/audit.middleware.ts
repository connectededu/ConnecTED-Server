import { Request, Response, NextFunction } from 'express';
import { createAuditLog } from '../services/audit.service';

export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Only log mutating requests (Create, Update, Delete)
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    // Intercept response finish to log after action completes successfully
    const originalSend = res.send;
    
    res.send = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const user = (req as any).user;
          
          let userName = 'System/Anonymous';
          let userRole = 'unknown';
          let loggedUserId = 'system';

          if (user) {
            loggedUserId = user._id || user.uid || user.id || 'system';
            userName = user.name || user.email || 'User';
            userRole = user.role || 'unknown';
          } else if (body) {
            try {
              const parsed = typeof body === 'string' ? JSON.parse(body) : body;
              const data = parsed.data || parsed;
              const userObj = data.user || data;
              if (userObj && (userObj.id || userObj._id || userObj.uid)) {
                loggedUserId = userObj.id || userObj._id || userObj.uid;
                userName = userObj.name || userObj.email || 'Anonymous';
                userRole = userObj.role || 'user';
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
          
          // Try to guess target type from URL parts
          const pathParts = req.originalUrl.split('?')[0].split('/');
          
          const resourceMap: Record<string, string> = {
            'users': 'user',
            'students': 'student',
            'classes': 'class',
            'announcements': 'announcement',
            'events': 'event',
            'grades': 'grade',
            'attendance': 'attendance',
            'messages': 'message',
            'notifications': 'notification',
            'programs': 'program',
            'subject-groups': 'subjectGroup',
            'homework': 'homework',
          };
          
          let targetType: any = 'system';
          for (let i = pathParts.length - 1; i >= 0; i--) {
            const part = pathParts[i];
            if (resourceMap[part]) {
              targetType = resourceMap[part];
              break;
            }
          }

          let action = 'UPDATED';
          if (req.method === 'POST') action = 'CREATED';
          else if (req.method === 'DELETE') action = 'DELETED';

          let targetId = req.params.id || 'N/A';
          
          // If not found in params, try to extract from the last segment of the path
          if (targetId === 'N/A') {
            const lastPart = pathParts[pathParts.length - 1];
            if (lastPart && !resourceMap[lastPart] && !['search', 'register', 'login', 'logout', 'change-password', 'reset-password'].includes(lastPart)) {
              targetId = lastPart;
            }
          }
          
          // If still N/A, try to extract from response body
          if (targetId === 'N/A' && body) {
            try {
              const parsed = typeof body === 'string' ? JSON.parse(body) : body;
              const data = parsed.data || parsed;
              targetId = data.id || data._id || data.uid || targetId;
            } catch (e) {
              // Ignore parsing errors
            }
          }

          const actionString = `${targetType.toUpperCase()}_${action}`;
          const detailsString = `${userName} (${userRole}) performed ${req.method} on ${req.originalUrl}`;

          // Create a sanitized body copy to avoid logging sensitive fields
          let sanitizedBody: any = undefined;
          if (req.body) {
            sanitizedBody = { ...req.body };
            // Strip out sensitive fields
            const sensitiveFields = ['password', 'token', 'secret', 'passwordConfirm', 'currentPassword', 'newPassword'];
            for (const field of sensitiveFields) {
              if (field in sanitizedBody) {
                sanitizedBody[field] = '[REDACTED]';
              }
            }
          }

          // Log asynchronously
          createAuditLog({
            userId: loggedUserId.toString(),
            action: actionString,
            targetType,
            targetId: targetId.toString(),
            details: detailsString,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: {
              body: sanitizedBody,
              params: req.params,
              query: req.query,
            }
          }).catch(err => console.error('Audit Middleware Logging Error:', err));
        } catch (err) {
          console.error('Audit Middleware Interception Error:', err);
        }
      }
      return originalSend.call(this, body);
    };
  }
  
  next();
};
