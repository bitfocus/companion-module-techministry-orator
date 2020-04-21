## TechMinistry-Orator

This module will allow you to send messages to a remote device running Tech Ministry Orator, a text to speech (TTS) service that supports both System/OS voices and Amazon Polly voices.

### Configuration
* The remote device must be running Orator, a listener program that relays the text to speech commands out the sound card of the server.
* The software can be downloaded from <http://www.github.com/josephdadams/orator>.
* Configure the instance with the IP address of the remote machine.
* The module makes HTTP requests over port 7000 by default, however this is configurable in the listener software.

### To use the module
Add an action to a button and choose the action you wish to use.

**Available actions:**
* Send Message using System/OS Voice
* Send **Scheduled** Message using System/OS Voice
* Send Message using Amazon Polly Voice
* Send **Scheduled** Message using Amazon Polly Voice
* Mute All Speech Output
* Mute A Specific Client
* Unmute All Speech Output
* Unmute A Specific Client
* Stop All Current Speech Output
* Stop Current Speech Output on a Specific Client