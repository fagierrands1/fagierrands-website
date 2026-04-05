# 🔑 Backend VAPID Setup

## Django Backend Environment Variables

Add these to your Django backend `.env` file:

```env
# VAPID Keys for Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_SUBJECT=mailto:notifications@your-domain.com
```

## Required Python Package

```bash
pip install pywebpush
```

## Django Settings

Add to your `settings.py`:

```python
# settings.py
import os

# VAPID Configuration
VAPID_PUBLIC_KEY = os.getenv('VAPID_PUBLIC_KEY')
VAPID_PRIVATE_KEY = os.getenv('VAPID_PRIVATE_KEY') 
VAPID_SUBJECT = os.getenv('VAPID_SUBJECT', 'mailto:notifications@fagierrands.com')
```

## Backend Endpoints to Implement

### 1. Push Subscription Endpoint

```python
# views.py
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from pywebpush import webpush, WebPushException
from django.conf import settings

@csrf_exempt
@login_required
def subscribe_to_push(request):
    """Subscribe user to push notifications"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            subscription_info = data.get('subscription')
            
            # Save subscription to database
            from .models import UserPushSubscription
            UserPushSubscription.objects.update_or_create(
                user=request.user,
                defaults={
                    'subscription_data': subscription_info,
                    'user_agent': data.get('user_agent', ''),
                    'is_active': True
                }
            )
            
            return JsonResponse({'success': True, 'message': 'Subscription saved'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
@login_required  
def send_push_notification(request):
    """Send push notification to user"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id', request.user.id)
            
            # Get user's push subscription from database
            from .models import UserPushSubscription
            subscription = UserPushSubscription.objects.get(
                user_id=user_id, 
                is_active=True
            )
            
            # Prepare notification payload
            payload = {
                'title': data.get('title', 'Fagi Errands'),
                'body': data.get('message', 'You have a new notification'),
                'icon': '/logo192.png',
                'badge': '/logo192.png',
                'action_link': data.get('action_link', '/'),
                'tag': data.get('tag', 'fagi-notification')
            }
            
            # Send push notification
            webpush(
                subscription_info=subscription.subscription_data,
                data=json.dumps(payload),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={
                    'sub': settings.VAPID_SUBJECT
                }
            )
            
            return JsonResponse({'success': True, 'message': 'Notification sent'})
            
        except UserPushSubscription.DoesNotExist:
            return JsonResponse({'error': 'No push subscription found'}, status=404)
        except WebPushException as ex:
            return JsonResponse({'error': f'Push failed: {str(ex)}'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)
```

### 2. Database Model

```python
# models.py
from django.db import models
from django.contrib.auth.models import User

class UserPushSubscription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    subscription_data = models.JSONField()
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['user']
        
    def __str__(self):
        return f"Push subscription for {self.user.username}"
```

### 3. URL Configuration

```python
# urls.py
from django.urls import path
from . import views

urlpatterns = [
    # ... your existing URLs
    path('api/push-subscriptions/', views.subscribe_to_push, name='subscribe_to_push'),
    path('api/send-push/', views.send_push_notification, name='send_push_notification'),
]
```

### 4. Notification Integration

```python
# In your existing notification creation code
def create_notification(user, title, message, notification_type='info', action_link=None):
    """Create notification and send push if user is subscribed"""
    
    # Create your existing notification record
    notification = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        type=notification_type,
        action_link=action_link
    )
    
    # Send push notification if user has subscription
    try:
        subscription = UserPushSubscription.objects.get(user=user, is_active=True)
        
        payload = {
            'title': title,
            'body': message,
            'icon': '/logo192.png',
            'action_link': action_link or '/',
            'tag': f'notification-{notification.id}'
        }
        
        webpush(
            subscription_info=subscription.subscription_data,
            data=json.dumps(payload),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={'sub': settings.VAPID_SUBJECT}
        )
        
    except UserPushSubscription.DoesNotExist:
        # User doesn't have push notifications enabled
        pass
    except Exception as e:
        # Log error but don't fail notification creation
        print(f"Push notification failed: {e}")
    
    return notification
```

## Testing Push Notifications

### 1. Test Subscription
```bash
curl -X POST http://localhost:8000/api/push-subscriptions/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"subscription": {...}, "user_agent": "Test"}'
```

### 2. Test Push Send
```bash
curl -X POST http://localhost:8000/api/send-push/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title": "Test", "message": "Hello from backend!"}'
```

## Security Notes

- ✅ Keep `VAPID_PRIVATE_KEY` secret and secure
- ✅ Use environment variables, never commit keys to git
- ✅ Use HTTPS in production (required for push notifications)
- ✅ Validate and sanitize all push notification data
- ✅ Implement rate limiting for push endpoints
- ✅ Log push notification attempts for debugging

## Your Keys Are Ready! 🎉

Your frontend is now configured with VAPID keys and will:
- ✅ Register service worker automatically
- ✅ Subscribe to push notifications when user allows
- ✅ Handle incoming push messages
- ✅ Show notifications even when app is closed

Once you implement the backend endpoints, you'll have a complete push notification system!