from rest_framework.decorators import api_view, permission_classes,authentication_classes
from rest_framework.response import Response
from .models import* #User,Record, Budget
from .serializers import* #UserSerializer, RecordSerializer, BudgetSerializer
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.views import APIView
from rest_framework import status,viewsets
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate,get_user_model
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
import re
import traceback



User = get_user_model()

@api_view(['POST'])
def register_user(request):
    email = request.data.get('email_address')
    password = request.data.get('password')

    if not email or not password:
        return Response({'detail': 'Email and password are required.'}, status=400)

    # Email validation
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return Response({'detail': 'Invalid email format.'}, status=400)

    if User.objects.filter(email_address=email).exists():
        return Response({'detail': 'Email already registered.'}, status=400)

    user = User.objects.create_user(email_address=email, password=password)
    return Response({'detail': 'User registered successfully.'}, status=201)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    email = request.data.get('email_address')
    password = request.data.get('password')

    if not email or not password:
        return Response(
            {'detail': 'Email address and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email_address=email)
    except ObjectDoesNotExist:
        return Response(
            {'detail': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.check_password(password):
        return Response(
            {'detail': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # At this point, credentials are valid → issue tokens
    refresh = RefreshToken.for_user(user)
    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }, status=status.HTTP_200_OK)

# Records start here




User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def create_record(request):
    try:
        data = request.data
        print("📩 Received data:", data)

        required_fields = ['recordType', 'category', 'note', 'amount', 'time', 'date', 'email_address']
        for field in required_fields:
            if field not in data or data[field] in [None, ""]:
                return Response({"error": f"Missing required field: {field}"}, status=400)

        email = data['email_address']

        try:
            user = User.objects.get(email_address=email)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)

        record = Record.objects.create(
            user=user,
            record_type=data['recordType'],
            category=data['category'],
            note=data['note'],
            amount=data['amount'],
            time=data['time'],
            date=data['date'],
        )
        print("📦 Created record:", record)


        return Response({"message": "Record created successfully"}, status=201)

    except Exception as e:
        traceback.print_exc()  # 🔥 Shows full error in terminal
        return Response({"error": str(e)}, status=500)

@api_view(['PUT', 'PATCH'])
def update_record(request, record_id):
    data = request.data.copy()
    
    try:
        user = User.objects.get(email_address=data['email_address'])
    except ObjectDoesNotExist:
        return Response({'detail': 'User not found'}, status=404)

    try:
        record = Record.objects.get(id=record_id, user=user)
    except Record.DoesNotExist:
        return Response({'detail': 'Record not found'}, status=404)

    # Update allowed fields
    for field in ['recordType', 'category', 'note', 'amount', 'time', 'date']:
        if field in data:
            setattr(record, field, data[field])

    record.save()
    return Response({'message': 'Record updated successfully'})



# Fetch the custom User model

User = get_user_model()
@api_view(['POST'])
@permission_classes([AllowAny])
def get_records(request):
    email = request.data.get('email_address')

    try:
        user = User.objects.get(email_address=email)
    except ObjectDoesNotExist:
        return Response({'detail': 'User not found'}, status=404)

    records = Record.objects.filter(user=user)
    return Response(RecordSerializer(records, many=True).data)


@api_view(['DELETE'])
def delete_record(request):
    record_id = request.data.get("id")
    if not record_id:
        return Response({'detail': 'Record ID missing'}, status=400)

    try:
        record = Record.objects.get(id=record_id)
        record.delete()
        return Response({'message': 'Record deleted successfully'})
    except Record.DoesNotExist:
        return Response({'detail': 'Record not found'}, status=404)




# record functions end here


# Budget functions start here


@api_view(['POST'])
def create_budget(request):
    data = request.data
    email = data.get('email_address')

    if not email:
        return Response({"detail": "Email is required"}, status=400)

    try:
        user = User.objects.get(email_address=email)
    except ObjectDoesNotExist:
        return Response({"detail": "User not found"}, status=404)

    # Check if budget already exists
    existing = Budget.objects.filter(
        user=user,
        month=data['month'],
        year=data['year'],
        
    ).first()

    if existing:
        existing.budget = data['budget']
        existing.save()
        return Response(BudgetSerializer(existing).data)

    # Create new budget (attach user ForeignKey manually)
    serializer = BudgetSerializer(data=data)
    if serializer.is_valid():
        serializer.save(user=user)  # 👈 pass user here
        return Response(serializer.data)

    return Response(serializer.errors, status=400)

@api_view(['PATCH'])
def update_budget(request, budget_id):
    data = request.data
    try:
        user = User.objects.get(email_address=data['email_address'])
        if user.password != data['password']:
            return Response({"detail": "Incorrect password"}, status=400)
    except ObjectDoesNotExist:
        return Response({"detail": "User not found"}, status=404)

    try:
        budget = Budget.objects.get(id=budget_id, email_address=data['email_address'])
    except Budget.DoesNotExist:
        return Response({"detail": "Budget not found"}, status=404)

    for field in [ 'budget', 'month', 'year']:
        if field in data:
            setattr(budget, field, data[field])
    budget.save()
    return Response(BudgetSerializer(budget).data)

@api_view(['GET'])
def last_budget_update(request):
    email = request.query_params.get('email_address')
    if not email:
        return Response({'detail': 'email_address is required'}, status=400)

    try:
        # Filter by user email, order by updated_at desc, pick first
        last = Budget.objects.filter(user__email_address=email).order_by('-updated_at').first()
    except ObjectDoesNotExist:
        last = None

    if not last:
        return Response({'detail': 'No budgets found'}, status=404)

    data = BudgetSerializer(last).data
    return Response(data)

@api_view(['POST'])
def get_budgets(request):
    data = request.data
    try:
        user = User.objects.get(email_address=data['email_address'])
        if user.password != data['password']:
            return Response({"detail": "Incorrect password"}, status=400)
    except ObjectDoesNotExist:
        return Response({"detail": "User not found"}, status=404)
    budgets = Budget.objects.filter(email_address=data['email_address'])
    return Response(BudgetSerializer(budgets, many=True).data)


@api_view(['DELETE'])
def delete_budget(request):
    data = request.data
    try:
        user = User.objects.get(email_address=data['email_address'])
        if user.password != data['password']:
            return Response({"detail": "Incorrect password"}, status=400)
    except ObjectDoesNotExist:
        return Response({"detail": "User not found"}, status=404)
    data.pop('password')
    Budget.objects.filter(**data).delete()
    return Response({"message": "Budget deleted successfully"})

@api_view(['PATCH'])
def change_password(request):
    data = request.data
    try:
        user = User.objects.get(email_address=data['email_address'])
        if user.password != data['password']:
            return Response({"detail": "Incorrect password"}, status=400)
        user.password = data['newPassword']
        user.save()
        return Response(UserSerializer(user).data)
    except ObjectDoesNotExist:
        return Response({"detail": "User not found"}, status=404)

@api_view(['PATCH'])
def change_username(request):
    data = request.data
    try:
        user = User.objects.get(email_address=data['email_address'])
        if user.password != data['password']:
            return Response({"detail": "Incorrect password"}, status=400)
        user.username = data['newUsername']
        user.save()
        return Response(UserSerializer(user).data)
    except ObjectDoesNotExist:
        return Response({"detail": "User not found"}, status=404)




class BudgetListView(APIView):
    def get(self, request):
        budgets = Budget.objects.all()
        serializer = BudgetSerializer(budgets, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = BudgetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class BudgetViewSet(viewsets.ModelViewSet):
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer

class RecordViewSet(viewsets.ModelViewSet):
    queryset = Record.objects.all()
    serializer_class = RecordSerializer
